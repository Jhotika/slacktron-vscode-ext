import * as vscode from "vscode";

const FOCUS_TIME = 15;

export class SlacktronViewProvider implements vscode.WebviewViewProvider {
  private webviewView?: vscode.WebviewView;
  private timerEndTime?: number;
  private timerInterval?: NodeJS.Timeout;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible && this.timerEndTime) {
        const timeLeft = this.timerEndTime - Date.now();
        if (timeLeft > 0) {
          webviewView.webview.postMessage({ 
            type: 'updateTimer', 
            timeLeft: Math.ceil(timeLeft / 1000) 
          });
        }
      }
    });

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "startTimer":
          this.startTimer();
          break;
        case "timerComplete":
          this.showMeditationPrompt();
          break;
        case "meditateClicked":
          vscode.env.openExternal(vscode.Uri.parse("https://algodetox.com/meditate"));
          this.hideNotifications();
          break;
      }
    });
  }

  private startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.timerEndTime = Date.now() + (FOCUS_TIME * 1000);
    this.timerInterval = setInterval(() => {
      if (this.timerEndTime) {
        const timeLeft = this.timerEndTime - Date.now();
        if (timeLeft <= 0) {
          clearInterval(this.timerInterval);
          this.timerEndTime = undefined;
          this.showMeditationPrompt();
        } else if (this.webviewView?.visible) {
          this.webviewView.webview.postMessage({ 
            type: 'updateTimer', 
            timeLeft: Math.ceil(timeLeft / 1000) 
          });
        }
      }
    }, 1000);
  }

  private showMeditationPrompt() {
    vscode.window.showInformationMessage("Time to meditate!", "Meditate Now")
      .then(selection => {
        if (selection === "Meditate Now") {
          vscode.env.openExternal(vscode.Uri.parse("https://algodetox.com/meditate"));
          this.hideNotifications();
        }
      });
  }

  private hideNotifications() {
    if (this.webviewView) {
      this.webviewView.webview.postMessage({ type: 'hideNotifications' });
    }
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
            <div id="timer" class="hidden"></div>
            <button class="button hidden" id="meditateButton">Meditate</button>
  
            <script>
              const vscode = acquireVsCodeApi();
              
              window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                  case 'updateTimer':
                    const timerDiv = document.getElementById('timer');
                    timerDiv.classList.remove('hidden');
                    timerDiv.textContent = \`Time remaining: \${message.timeLeft} seconds\`;
                    if (message.timeLeft <= 0) {
                      timerDiv.classList.add('hidden');
                      document.getElementById('meditateButton').classList.remove('hidden');
                      vscode.postMessage({ type: 'timerComplete' });
                    }
                    break;
                  case 'hideNotifications':
                    document.getElementById('meditateButton').classList.add('hidden');
                    break;
                }
              });
              
              document.getElementById('focusMode').addEventListener('click', () => {
                const meditateButton = document.getElementById('meditateButton');
                meditateButton.classList.add('hidden');
                document.getElementById('timer').classList.remove('hidden');
                vscode.postMessage({ type: 'startTimer' });
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
