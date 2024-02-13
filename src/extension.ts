import * as vscode from "vscode";
import { subscribeToDocumentChanges } from "./diagnostics";

/**
 * Activates the extension.
 *
 * @param context The extension context.
 */
export function activate(context: vscode.ExtensionContext) {
  // Diagnostics
  const cmsDiagnostics = vscode.languages.createDiagnosticCollection("cms");
  context.subscriptions.push(cmsDiagnostics);

  subscribeToDocumentChanges(context, cmsDiagnostics);

  // Code Actions
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      [
        { language: "php", scheme: "file" },
        { language: "html", scheme: "file" },
      ],
      new QuickFixProvider(),
      {
        providedCodeActionKinds: QuickFixProvider.providedCodeActionKinds,
      }
    )
  );
}

/**
 * Represents a code action provider that provides quick fixes for diagnostics.
 */
class QuickFixProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  /**
   * Provides code actions for a given document, range, context, and token.
   * @param document The text document in which the code actions are provided.
   * @param range The range or selection for which code actions are provided.
   * @param context The code action context.
   * @param token A cancellation token.
   * @returns An array of code actions or undefined.
   */
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.CodeAction[] | undefined {
    const quickFixes: vscode.CodeAction[] = [];

    context.diagnostics.forEach((diagnostic) => {
      const quickFix = this.createQuickFix(document, diagnostic);
      if (quickFix) {
        quickFixes.push(quickFix);
      }
    });

    return quickFixes;
  }

  /**
   * Creates a quick fix for a given diagnostic in the text document.
   * @param document The text document containing the diagnostic.
   * @param diagnostic The diagnostic for which the quick fix is created.
   * @returns The created code action representing the quick fix.
   */
  private createQuickFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic
  ): vscode.CodeAction | undefined {
    const action = new vscode.CodeAction(
      `Delete unnecessary line`,
      QuickFixProvider.providedCodeActionKinds[0]
    );
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    action.edit = new vscode.WorkspaceEdit();

    const range = new vscode.Range(
      diagnostic.range.start.line,
      0,
      diagnostic.range.start.line + 1,
      0
    );
    action.edit.delete(document.uri, range);

    return action;
  }
}
