const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  let disposable = vscode.commands.registerCommand('frontend-stack-starter.createProject', async function () {
    const language = await vscode.window.showQuickPick(['JavaScript', 'TypeScript'], {
      placeHolder: 'Choose the language for your project'
    });
    if (!language) return;

    const features = await vscode.window.showQuickPick(
      [
        'React',
        'Vite',
        'TailwindCSS',
        'React Router',
        'Axios',
        'Redux Toolkit',
        'Zustand',
        'Chakra UI',
        'Framer Motion',
        'ESLint + Prettier'
      ],
      {
        canPickMany: true,
        placeHolder: 'Select technologies to include in your project'
      }
    );

    if (!features || features.length === 0) {
      vscode.window.showInformationMessage('No technologies selected.');
      return;
    }

    const pkgManager = await vscode.window.showQuickPick(['npm', 'yarn', 'pnpm'], {
      placeHolder: 'Select a package manager'
    });
    if (!pkgManager) return;

    const projectName = await vscode.window.showInputBox({
      prompt: 'Enter your project name',
      value: 'my-app'
    });
    if (!projectName) return;

    const folderUri = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      openLabel: 'Select folder to create project in'
    });
    if (!folderUri || folderUri.length === 0) return;

    const projectRoot = folderUri[0].fsPath;
    const projectPath = path.join(projectRoot, projectName);
    const template = language === 'TypeScript' ? 'react-ts' : 'react';

    const terminal = vscode.window.createTerminal('Frontend Setup');
    terminal.show();

    const commands = [
      `cd "${projectRoot}"`,
      `${pkgManager} create vite@latest ${projectName} -- --template ${template}`,
      `cd "${projectName}"`,
      `${pkgManager} install`
    ];

    if (features.includes('TailwindCSS')) {
      commands.push(`${pkgManager} install tailwindcss @tailwindcss/vite`);
    }

    if (features.includes('React Router')) {
      commands.push(`${pkgManager} install react-router-dom`);
    }

    if (features.includes('Axios')) {
      commands.push(`${pkgManager} install axios`);
    }

    if (features.includes('Redux Toolkit')) {
      commands.push(`${pkgManager} install @reduxjs/toolkit react-redux`);
    }

    if (features.includes('Zustand')) {
      commands.push(`${pkgManager} install zustand`);
    }

    if (features.includes('Chakra UI')) {
      commands.push(`${pkgManager} install @chakra-ui/react @emotion/react @emotion/styled framer-motion`);
    } else if (features.includes('Framer Motion')) {
      commands.push(`${pkgManager} install framer-motion`);
    }

    if (features.includes('ESLint + Prettier')) {
      commands.push(`${pkgManager} install -D eslint prettier eslint-config-prettier eslint-plugin-react`);
    }

    // Run setup commands
    commands.forEach(cmd => terminal.sendText(cmd));

    // Wait for install to complete
    setTimeout(() => {
      // Tailwind Plugin Configuration
      if (features.includes('TailwindCSS')) {
        const viteConfigFile = path.join(
          projectPath,
          `vite.config.${language === 'TypeScript' ? 'ts' : 'js'}`
        );

        fs.readFile(viteConfigFile, 'utf8', (err, data) => {
          if (err) {
            vscode.window.showErrorMessage('Failed to read vite.config file.');
            return;
          }

          let updated = data;
          if (!updated.includes('@tailwindcss/vite')) {
            updated = `import tailwindcss from '@tailwindcss/vite';\n` + updated;
            updated = updated.replace(/plugins:\s*\[/, 'plugins: [\n    tailwindcss(),');
          }

          fs.writeFile(viteConfigFile, updated, 'utf8', err => {
            if (err) {
              vscode.window.showErrorMessage('Failed to update vite.config with Tailwind plugin.');
            } else {
              vscode.window.showInformationMessage('vite.config updated with Tailwind plugin.');
            }
          });
        });

        // CSS Import
        const cssFile = path.join(projectPath, 'src', 'index.css');
        const importLine = `@import \"tailwindcss\";\n`;

        fs.readFile(cssFile, 'utf8', (err, data) => {
          if (err) {
            vscode.window.showErrorMessage('Failed to read index.css');
            return;
          }

          if (!data.includes(importLine.trim())) {
            const updatedCss = importLine + data;
            fs.writeFile(cssFile, updatedCss, err => {
              if (err) {
                vscode.window.showErrorMessage('Failed to insert Tailwind import.');
              } else {
                vscode.window.showInformationMessage('Tailwind import added to index.css');
              }
            });
          } else {
            vscode.window.showInformationMessage('Tailwind import already present in index.css');
          }
        });
      }

      // README.md generation
      const readme = `# ${projectName}\n\nGenerated with Frontend Stack Starter 🚀\n\n## Language: ${language}\n\n## Tech Stack\n- ${features.join('\n- ')}\n\n## Getting Started\n\n\`\`\`bash\ncd ${projectName}\n${pkgManager} install\n${pkgManager === 'npm' ? 'npm run dev' : pkgManager + ' dev'}\n\`\`\`\n`;
      fs.writeFile(path.join(projectPath, 'README.md'), readme, err => {
        if (!err) {
          vscode.window.showInformationMessage('README.md created');
        }
      });
    }, 12000);
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};
