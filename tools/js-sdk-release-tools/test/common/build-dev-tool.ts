
import axios from 'axios';
import * as fs from 'node:fs';
import * as path from 'path';
import * as shell from 'shelljs';

console.log('hello')

const url = 'https://github.com/Azure/azure-sdk-for-js/archive/refs/heads/main.zip';

const tempDir = path.join(__dirname, ".temp");

async function downloadAzureSdk() {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }

    const response = await axios.get(url, { responseType: 'arraybuffer' });
    if (response.status !== 200) throw new Error(`unexpected response ${response.statusText}`);
    const sdkPath = path.join(tempDir, 'azure-sdk-for-js.zip');
    const fileData = Buffer.from(response.data, 'binary');
    await fs.promises.writeFile(sdkPath, fileData);
    console.log('File saved!');

    return sdkPath;
}

async function buildAzureDevTool() {
    shell.cd(tempDir);
    shell.exec('npm install -g @microsoft/rush');
    shell.exec('rush update');

}

downloadAzureSdk();