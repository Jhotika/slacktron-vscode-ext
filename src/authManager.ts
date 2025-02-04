import * as vscode from "vscode";

export class AuthManager {
  private static instance: AuthManager | null = null;
  private secretStorage: vscode.SecretStorage | null = null;
  private static readonly TOKEN_KEY = "slacktron-slack-auth-token";

  private constructor(context: vscode.ExtensionContext) {
    this.secretStorage = context.secrets;
  }

  static getInstance(context: vscode.ExtensionContext): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager(context);
    }
    return AuthManager.instance;
  }

  async getToken(): Promise<string | undefined> {
    return this.secretStorage?.get(AuthManager.TOKEN_KEY);
  }

  async storeToken(token: string): Promise<void> {
    await this.secretStorage?.store(AuthManager.TOKEN_KEY, token);
  }

  async clearToken(): Promise<void> {
    await this.secretStorage?.delete(AuthManager.TOKEN_KEY);
  }
}
