import * as vscode from "vscode";
import { CHECK_INTERVAL, INACTIVE_THRESHOLD, SLACK_URL } from "./config";
import { SlacktronService } from "./service";

class StatusBarManager {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right
    );
  }

  updateAuthStatus(isAuthenticated: boolean) {
    if (isAuthenticated) {
      this.statusBarItem.text = "$(check) Slacktron Connected";
      this.statusBarItem.command = "slacktron.logout";
    } else {
      this.statusBarItem.text = "$(key) Slacktron Login";
      this.statusBarItem.command = "slacktron.login";
    }
    this.statusBarItem.show();
  }

  dispose() {
    this.statusBarItem.dispose();
  }
}

class ActivityTracker {
  private lastActiveTime: number = Date.now();
  private isActive: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(private readonly slacktronService: SlacktronService) {}

  start() {
    // Track editor changes
    const disposable = vscode.window.onDidChangeTextEditorSelection(() => {
      this.lastActiveTime = Date.now();
      this.updateStatusIfNeeded();
    });

    // Periodic check
    this.intervalId = setInterval(() => {
      this.updateStatusIfNeeded();
    }, CHECK_INTERVAL);

    return disposable;
  }

  private async updateStatusIfNeeded() {
    const timeSinceLastActivity = Date.now() - this.lastActiveTime;
    const shouldBeActive = timeSinceLastActivity <= INACTIVE_THRESHOLD;

    if (this.isActive !== shouldBeActive) {
      this.isActive = shouldBeActive;
      await this.slacktronService.genSetSlackStatusAsActive();
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

export async function activate(context: vscode.ExtensionContext) {
  const service = new SlacktronService(context);

  const statusBarManager = new StatusBarManager();
  statusBarManager.updateAuthStatus(await service.genIsAuthenticated());

  // Register commands
  const loginCommand = vscode.commands.registerCommand(
    "slacktron.login",
    async () => {
      vscode.env.openExternal(vscode.Uri.parse(SLACK_URL));
    }
  );

  const logoutCommand = vscode.commands.registerCommand(
    "slacktron.logout",
    async () => {
      await service.genClearToken();
      statusBarManager.updateAuthStatus(false);
      vscode.window.showInformationMessage("Logged out from Slacktron");
    }
  );

  // Handle OAuth redirect
  const uriHandler = vscode.window.registerUriHandler({
    handleUri: async (uri: vscode.Uri) => {
      if (uri.path === "/auth-callback") {
        const token = uri.query.split("=")[1];
        if (token) {
          await service.genUpdateToken(token);
          await service.genInitialize();
          statusBarManager.updateAuthStatus(true);
          vscode.window.showInformationMessage(
            "Successfully connected to Slack!"
          );
        }
      }
    },
  });

  // Start activity tracking if authenticated
  let activityTracker: ActivityTracker | undefined;
  if (await service.genIsAuthenticated()) {
    activityTracker = new ActivityTracker(service);
    context.subscriptions.push(activityTracker.start());
  }

  context.subscriptions.push(
    statusBarManager,
    loginCommand,
    logoutCommand,
    uriHandler,
    {
      dispose: () => activityTracker?.stop(),
    }
  );
}

export function deactivate() {
  // Cleanup any resources if needed
}
