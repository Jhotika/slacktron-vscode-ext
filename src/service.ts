import * as vscode from "vscode";
import { genUpdateStatus, genUpdateSnooze } from "./apiClient";
import { AuthManager } from "./authManager";

export class SlacktronService {
  private authManager: AuthManager;

  constructor(context: vscode.ExtensionContext) {
    this.authManager = AuthManager.getInstance(context);
  }

  async genUpdateToken(token: string) {
    await this.authManager.storeToken(token);
  }

  async genInitialize() {
    const token: string | undefined = await this.authManager.getToken();
    if (!token) {
      vscode.window.showWarningMessage("Please authenticate with Slack");
    }
  }

  async genSetSlackStatusAsActive() {
    // Get token from extension storage instead of hardcoded value
    const token: string | undefined = await this.authManager.getToken();

    if (!token) {
      vscode.window
        .showWarningMessage(
          "Please authenticate with Slack to use Slacktron",
          "Authenticate"
        )
        .then((selection) => {
          if (selection === "Authenticate") {
            vscode.commands.executeCommand("vscode-slack-status.authenticate");
          }
        });
      return;
    }

    try {
      const [_statusResponse, _snoozeResponse] = await Promise.all([
        genUpdateStatus(token),
        genUpdateSnooze(token),
      ]);
      const statusResponse = await _statusResponse.json();
      const snoozeResponse = await _snoozeResponse.json();

      if (
        !(statusResponse as unknown as { ok: string })?.ok ||
        !(snoozeResponse as unknown as { ok: string })?.ok
      ) {
        vscode.window.showErrorMessage("Failed to update Slack status");
      }
    } catch (error) {
      console.error("Failed to update Slack status:", error);
      vscode.window.showErrorMessage("Failed to update Slack status");
    }
  }

  async genIsAuthenticated() {
    const token: string | undefined = await this.authManager.getToken();
    return !!token;
  }

  async genClearToken() {
    await this.authManager.clearToken();
  }
}
