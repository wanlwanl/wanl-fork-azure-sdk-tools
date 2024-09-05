import { RuleIds } from './../common/models/rules/rule-ids';
import * as parser from '@typescript-eslint/parser';

import { CreateOperationRule, DetectProject, LinterSettings, ParseForESLintResult, RuleMessage } from './common/types';
import { Renderer, marked } from 'marked';
import { basename, join, posix, relative } from 'node:path';
import { toPosixPath, turbolog } from '../utils/common-utils';
import { exists, outputFile, readFile, remove } from 'fs-extra';

import { TSESLint } from '@typescript-eslint/utils';
import { glob } from 'glob';
import { logger } from '../logging/logger';
import { Project, ScriptTarget } from 'ts-morph';
import { SharedConfig } from '@typescript-eslint/utils/ts-eslint';

const tsconfig = `
{
  "compilerOptions": {
    "jsx": "preserve",
    "target": "es5",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "lib": ["es2015", "es2017", "esnext"],
    "experimentalDecorators": true,
  "rootDir": "."
  },
  "include": [
    "**/*.ts",
  ],
  "exclude": ["**/node_modules/**/*.*"]
}
`;

interface SubProjectContext {
  code: string;
  relativeFilePath: string;
}
interface ProjectContext {
  root: string;
  baseline: SubProjectContext;
  current: SubProjectContext;
}

async function loadCodeFromApiView(path: string) {
  const content = await readFile(path, { encoding: 'utf-8' });
  const markdown = content.toString();
  const codeBlocks: string[] = [];
  const renderer = new Renderer();
  renderer.code = ({ text }) => {
    codeBlocks.push(text);
    return '';
  };
  marked(markdown, { renderer });
  if (codeBlocks.length !== 1) throw new Error(`Expected 1 code block, got ${codeBlocks.length} in "${path}".`);

  return codeBlocks[0];
}

async function prepareProject(
  currentPackageFolder: string,
  baselinePackageFolder: string,
  tempFolder: string
): Promise<ProjectContext> {
  const [currentCode, baselineCode] = await Promise.all([
    loadCodeFromApiView(currentPackageFolder),
    loadCodeFromApiView(baselinePackageFolder),
  ]);

  const relativeCurrentPath = join('current', 'review', 'index.ts');
  const relativeBaselinePath = join('baseline', 'review', 'index.ts');
  const currentPath = join(tempFolder, relativeCurrentPath);
  const baselinePath = join(tempFolder, relativeBaselinePath);
  const tsConfigPath = join(tempFolder, 'tsconfig.json');
  await Promise.all([
    outputFile(tsConfigPath, tsconfig, 'utf-8'),
    outputFile(currentPath, currentCode, 'utf-8'),
    outputFile(baselinePath, baselineCode, 'utf-8'),
  ]);
  return {
    root: tempFolder,
    baseline: {
      code: baselineCode,
      relativeFilePath: relativeBaselinePath,
    },
    current: {
      code: currentCode,
      relativeFilePath: relativeCurrentPath,
    },
  };
}

async function parseBaselinePackage(projectContext: ProjectContext): Promise<ParseForESLintResult> {
  const result = parser.parseForESLint(projectContext.baseline.code, {
    comment: true,
    tokens: true,
    range: true,
    loc: true,
    project: './tsconfig.json',
    tsconfigRootDir: projectContext.root,
    filePath: projectContext.baseline.relativeFilePath,
  });
  return result;
}

function prepareDetectPackage(projectContext: ProjectContext): DetectProject {
  const project = new Project({
    compilerOptions: { target: ScriptTarget.ES2022 },
  });
  const baseline = project.createSourceFile('review/baseline/index.ts', projectContext.baseline.code);
  const current = project.createSourceFile('review/current/index.ts', projectContext.current.code);
  return { baseline, current, project };
}

function loadRuleDefinitions(rules: Array<RuleIds>): Promise<{ creator: CreateOperationRule; id: RuleIds }[]> {
  return Promise.all(rules.map(async (id) => ({ creator: (await import(`./common/rules/${id}`)).default, id })));
}

// TODO: decouple defining rules and verification
async function detectBreakingChangesCore(
  projectContext: ProjectContext,
  ruleIds: Array<RuleIds>
): Promise<RuleMessage[] | undefined> {
  try {
    const breakingChangeResults: RuleMessage[] = [];
    const baselineParsed = await parseBaselinePackage(projectContext);
    const detectProject = prepareDetectPackage(projectContext);
    const linter = new TSESLint.Linter({ cwd: projectContext.root });
    const ruleDefinitions = await loadRuleDefinitions(ruleIds);
    ruleDefinitions.forEach((ruleDef) => {
      linter.defineRule(ruleDef.id, ruleDef.creator(baselineParsed, detectProject));
    });
    linter.defineParser('@typescript-eslint/parser', parser);
    const lintSettings: LinterSettings = {
      report<TMessage extends RuleMessage>(message: TMessage) {
        breakingChangeResults.push(message);
      },
    };
    const rules = ruleDefinitions.reduce((map: SharedConfig.RulesRecord, r) => {
      map[r.id] = [2];
      return map;
     }, {});
    linter.verify(
      projectContext.current.code,
      {
        rules,
        parser: '@typescript-eslint/parser',
        parserOptions: {
          filePath: projectContext.current.relativeFilePath,
          comment: true,
          tokens: true,
          range: true,
          loc: true,
          project: './tsconfig.json',
          tsconfigRootDir: projectContext.root,
        },
        settings: lintSettings as any,
      },
      projectContext.current.relativeFilePath
    );
    return breakingChangeResults;
  } catch (err) {
    logger.error(`Failed to detect breaking changes due to ${(err as Error).stack ?? err}`);
    return undefined;
  }
}

// TODO: remove cleanUpAtTheEnd
export async function detectBreakingChangesBetweenPackages(
  ruleIds: Array<RuleIds>,
  baselinePackageFolder: string | undefined,
  currentPackageFolder: string | undefined,
  tempFolder: string | undefined,
  cleanUpAtTheEnd: boolean = false
): Promise<Map<string, RuleMessage[] | undefined>> {
  if (!baselinePackageFolder) throw new Error(`Failed to use undefined or null baseline package folder`);
  if (!currentPackageFolder) throw new Error(`Failed to use undefined or null current package folder`);
  if (!tempFolder) throw new Error(`Failed to use undefined or null temp folder`);

  try {
    baselinePackageFolder = toPosixPath(baselinePackageFolder);
    currentPackageFolder = toPosixPath(currentPackageFolder);
    tempFolder = toPosixPath(tempFolder);

    const apiViewPathPattern = posix.join(baselinePackageFolder, 'review/*.api.md');
    const baselineApiViewPaths = await glob(apiViewPathPattern);
    const messsagesPromises = baselineApiViewPaths.map(async (baselineApiViewPath) => {
      const relativeApiViewPath = relative(baselinePackageFolder!, baselineApiViewPath);
      const apiViewBasename = basename(relativeApiViewPath);
      const currentApiViewPath = join(currentPackageFolder!, relativeApiViewPath);
      if (!(await exists(currentApiViewPath))) throw new Error(`Failed to find API view: ${currentApiViewPath}`);
      const projectContext = await prepareProject(currentApiViewPath, baselineApiViewPath, tempFolder!);
      const messages = await detectBreakingChangesCore(projectContext, ruleIds);
      return { name: apiViewBasename, messages };
    });
    const messagesMap = new Map<string, RuleMessage[] | undefined>();
    const promises = messsagesPromises.map(async (p) => {
      const result = await p;
      messagesMap.set(result.name, result.messages);
    });
    await Promise.all(promises);
    return messagesMap;
  } finally {
    if (cleanUpAtTheEnd) {
      if (await exists(tempFolder)) {
        await remove(tempFolder);
      }
    }
  }
}
