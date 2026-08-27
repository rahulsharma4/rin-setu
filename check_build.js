import { exec } from 'child_process';
import fs from 'fs';

const nodePath = 'C:\\Program Files\\Microsoft Visual Studio\\18\\Community\\MSBuild\\Microsoft\\VisualStudio\\NodeJs\\node.exe';
const npmCliPath = 'C:\\Program Files\\Microsoft Visual Studio\\18\\Community\\MSBuild\\Microsoft\\VisualStudio\\NodeJs\\node_modules\\npm\\bin\\npm-cli.js';

exec(`"${nodePath}" "${npmCliPath}" run build`, (error, stdout, stderr) => {
  const result = `=== ERROR ===\n${error ? error.stack : 'No error'}\n\n=== STDOUT ===\n${stdout}\n\n=== STDERR ===\n${stderr}`;
  fs.writeFileSync('build_result.txt', result);
  console.log('Done!');
});
