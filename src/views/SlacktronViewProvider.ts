import * as vscode from "vscode";
import { BreakActivitiesManager } from '../activities/activityManager';

// TODO(arnob): make this configurable
const FOCUS_TIME = 2400; // 40 minutes in seconds

export class SlacktronViewProvider implements vscode.WebviewViewProvider {
  private webviewView?: vscode.WebviewView;
  private timerEndTime?: number;
  private timerInterval?: NodeJS.Timeout;
  private activitiesManager: BreakActivitiesManager;
  private activityShown = false;

  constructor(private readonly _extensionUri: vscode.Uri) {
    this.activitiesManager = new BreakActivitiesManager();
  }

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
          this.showRandomActivity();
          break;
        case "activityClicked":
          if (data.url) {
            vscode.env.openExternal(vscode.Uri.parse(data.url));
          }
          this.hideNotifications();
          break;
      }
    });
  }

  private startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.activityShown = false;

    this.timerEndTime = Date.now() + (FOCUS_TIME * 1000);
    this.timerInterval = setInterval(() => {
      if (this.timerEndTime) {
        const timeLeft = this.timerEndTime - Date.now();
        if (timeLeft <= 0) {
          clearInterval(this.timerInterval);
          this.timerInterval = undefined;
          this.timerEndTime = undefined;
          this.webviewView?.webview.postMessage({ type: 'updateTimer', timeLeft: 0 });
          this.showRandomActivity();
        } else if (this.webviewView?.visible) {
          this.webviewView.webview.postMessage({ 
            type: 'updateTimer', 
            timeLeft: Math.ceil(timeLeft / 1000) 
          });
        }
      }
    }, 1000);
  }

  private showRandomActivity() {
    if (this.activityShown) return;
    this.activityShown = true;

    const activity = this.activitiesManager.fetchRandomActivity();

    if (activity.url) {
      vscode.window.showInformationMessage(
        activity.action,
        activity.name
      ).then(selection => {
        if (selection === activity.name) {
          if (activity.url) {
            vscode.env.openExternal(vscode.Uri.parse(activity.url));
          }
          this.hideNotifications();
        }
      });
    } else {
      vscode.window.showInformationMessage(activity.action);
    }

    this.webviewView?.webview.postMessage({ 
      type: 'showActivity', 
      activity 
    });
  }

  private hideNotifications() {
    this.webviewView?.webview.postMessage({ type: 'hideNotifications' });
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
              #activityText {
                text-align: center;
                margin: 10px 0;
              }
              .activity-container {
                margin-top: 20px;
                padding: 10px;
                border-radius: 4px;
                background-color: var(--vscode-editor-background);
              }
            </style>
          </head>
          <body>
            <button class="button" id="focusMode">Focus mode</button>
            <div id="timer" class="hidden"></div>
            <div class="activity-container hidden" id="activityContainer">
              <div id="activityText"></div>
              <button class="button" id="activityButton"></button>
            </div>
  
            <script>
              const vscode = acquireVsCodeApi();
              
              window.addEventListener('message', event => {
                const message = event.data;
                switch (message.type) {
                  case 'updateTimer':
                    const timerDiv = document.getElementById('timer');
                    timerDiv.classList.remove('hidden');
                    const minutes = Math.floor(message.timeLeft / 60);
                    const seconds = message.timeLeft % 60;
                    timerDiv.textContent = \`Time remaining: \${minutes}:\${seconds.toString().padStart(2, '0')}\`;
                    if (message.timeLeft <= 0) {
                      timerDiv.classList.add('hidden');
                      vscode.postMessage({ type: 'timerComplete' });
                    }
                    break;
                  case 'showActivity':
                    const activityContainer = document.getElementById('activityContainer');
                    const activityButton = document.getElementById('activityButton');
                    const activityText = document.getElementById('activityText');
                    
                    activityText.textContent = message.activity.action;
                    activityContainer.classList.remove('hidden');
                    
                    if (message.activity.url) {
                      activityButton.textContent = message.activity.name;
                      activityButton.classList.remove('hidden');
                      activityButton.onclick = () => {
                        vscode.postMessage({ 
                          type: 'activityClicked',
                          url: message.activity.url
                        });
                      };
                    } else {
                      activityButton.classList.add('hidden');
                    }
                    break;
                  case 'hideNotifications':
                    document.getElementById('activityContainer').classList.add('hidden');
                    break;
                }
              });
              
              document.getElementById('focusMode').addEventListener('click', () => {
                document.getElementById('activityContainer').classList.add('hidden');
                document.getElementById('timer').classList.remove('hidden');
                vscode.postMessage({ type: 'startTimer' });
              });
            </script>
          </body>
        </html>
      `;
  }
}
