import * as vscode from "vscode";

const FOCUS_TIME = 15; // Focus time in seconds

export class SlacktronViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "timerComplete":
          vscode.window.showInformationMessage("Time to meditate!", "Meditate Now")
            .then(selection => {
              if (selection === "Meditate Now") {
                vscode.env.openExternal(vscode.Uri.parse("https://algodetox.com/meditate"));
                webviewView.webview.postMessage({ type: 'hideNotifications' });
              }
            });
          break;
        case "meditateClicked":
          vscode.env.openExternal(vscode.Uri.parse("https://algodetox.com/meditate"));
          webviewView.webview.postMessage({ type: 'hideNotifications' });
          break;
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Slacktron</title>
            <style>
              .button {
                padding: 8px 16px;
                margin: 10px 0;
                width: 100%;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                border-radius: 4px;
                cursor: pointer;
              }
              .button:hover {
                background-color: var(--vscode-button-hoverBackground);
              }
              #timer {
                text-align: center;
                margin: 10px 0;
                font-size: 1.2em;
              }
              .hidden {
                display: none;
              }
            </style>
          </head>
          <body>
            <button class="button" id="focusMode">Focus mode</button>
            <div id="timer"></div>
            <button class="button hidden" id="meditateButton">Meditate</button>
  
            <script>
              const vscode = acquireVsCodeApi();
              const FOCUS_TIME = ${FOCUS_TIME};
              let timerInterval;
              
              window.addEventListener('message', event => {
                if (event.data.type === 'hideNotifications') {
                  document.getElementById('meditateButton').classList.add('hidden');
                }
              });
              
              document.getElementById('focusMode').addEventListener('click', () => {
                const timerDiv = document.getElementById('timer');
                const meditateButton = document.getElementById('meditateButton');
                let timeLeft = FOCUS_TIME;
                
                // Hide meditate button and show timer
                meditateButton.classList.add('hidden');
                timerDiv.classList.remove('hidden');
                
                clearInterval(timerInterval);
                timerInterval = setInterval(() => {
                  timerDiv.textContent = \`Time remaining: \${timeLeft} seconds\`;
                  timeLeft--;
                  
                  if (timeLeft < 0) {
                    clearInterval(timerInterval);
                    timerDiv.classList.add('hidden');
                    meditateButton.classList.remove('hidden');
                    vscode.postMessage({ type: 'timerComplete' });
                  }
                }, 1000);
              });

              document.getElementById('meditateButton').addEventListener('click', () => {
                vscode.postMessage({ type: 'meditateClicked' });
              });
            </script>
          </body>
        </html>
      `;
  }
}
