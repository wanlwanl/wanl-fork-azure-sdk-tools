import { LinterSettings } from '../azure/common/types';
import { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import path from 'path';
import util from 'util';
import chalk from 'chalk';

function colorizeTitle(title: any) {
  if (typeof title !== 'string') return title;
  const parts = title.split('\t').map((p, i, arr) => {
    if (i === 0) return p;
    if (i < arr.length - 1) return chalk.gray(chalk.underline(p));
    return chalk.inverse(chalk.bold(p));
  });
  if (parts.length === 1) return parts[0];
  return [parts[0], parts[parts.length - 1], ...parts.slice(1, parts.length - 1)].join(' ') + [' '];
}

// IMPORTANT: dev with chakrounanas.turbo-console-log vscode extension
export function turbolog(title?: any, ...optionalParams: any[]): void {
  let message = '' + colorizeTitle(title);
  optionalParams.forEach((p) => {
    const body = util.inspect(p, { depth: null, colors: true });
    message += body + chalk.dim('; ');
  });
  console.log(message);
}

// IMPORTANT: dev with chakrounanas.turbo-console-log vscode extension
export function turbologDetails(title?: any, ...optionalParams: any[]): void {
  title = colorizeTitle(title);
  console.log(title, 'BEG');
  optionalParams.forEach((p) => {
    const body = util.inspect(p, { depth: null, colors: true });
    console.log(body);
  });
  console.log(title, 'END');
}

export function getSettings(context: RuleContext<string, readonly unknown[]>) {
  return (context.settings as any as LinterSettings)!;
}

export function toPosixPath(winPath: string) {
  const posixPath = winPath.split(path.sep).join(path.posix.sep);
  return posixPath;
}
