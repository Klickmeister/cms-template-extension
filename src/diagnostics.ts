import * as vscode from "vscode";
import { CmsDiagnosticEntry } from "./types/diagnosticTypes";
import { CmsContainer } from "./types/containerTypes";
import containerDiagnosticData from "./data/containerDiagnostics.json";
import containerHelper from "./helpers/containerHelper";

export function refreshDiagnostics(
  doc: vscode.TextDocument,
  cmsDiagnostics: vscode.DiagnosticCollection
): void {
  const diagnostics: vscode.Diagnostic[] = [];

  let currentContainer: CmsContainer = {
    isBeingBuilt: false,
    isComplete: false,
    attributes: [],
  };
  for (let lineIndex = 0; lineIndex < doc.lineCount; lineIndex++) {
    const lineOfText = doc.lineAt(lineIndex);

    currentContainer = containerHelper.buildContainer(
      lineOfText,
      currentContainer,
      lineIndex
    );

    // Check if the current container is complete or is being built
    // If not, continue to the next line
    if (!currentContainer.isComplete || !currentContainer.isBeingBuilt) {
      continue;
    }

    // Make sure the current container has attributes (no empty text lines in the container)
    if (currentContainer.attributes.length === 0) {
      containerHelper.resetContainer();

      continue;
    }

    containerDiagnosticData.forEach((containerDiagnostic) => {
      const regex = new RegExp(`(${containerDiagnostic.code})`, "g");

      // check if the current container is of the type as the diagnostic entry
      const matchingContainerType = containerHelper.isMatchingContainerType(
        currentContainer,
        containerDiagnostic
      );
      if (!matchingContainerType) {
        return;
      }

      currentContainer.attributes.forEach((attribute) => {
        const result = regex.exec(attribute.attribute);
        if (result) {
          const diagnostic = createDiagnostic(
            doc,
            doc.lineAt(attribute.lineIndex),
            attribute.lineIndex,
            containerDiagnostic
          );
          diagnostics.push(diagnostic);
        }
      });
    });

    // reset currentContainer
    currentContainer = containerHelper.resetContainer();
  }

  cmsDiagnostics.set(doc.uri, diagnostics);
}

function createDiagnostic(
  doc: vscode.TextDocument,
  lineOfText: vscode.TextLine,
  lineIndex: number,
  cmsDiagnosticEntry: CmsDiagnosticEntry
): vscode.Diagnostic {
  // find where in the line of that the cmsDiagnostic is mentioned
  const index = lineOfText.text.indexOf(cmsDiagnosticEntry.code);

  // create range that represents, where in the document the word is
  const range = new vscode.Range(
    lineIndex,
    index,
    lineIndex,
    index + cmsDiagnosticEntry.code.length
  );

  const severity =
    vscode.DiagnosticSeverity[
      cmsDiagnosticEntry.severity as keyof typeof vscode.DiagnosticSeverity
    ];

  const diagnostic = new vscode.Diagnostic(
    range,
    cmsDiagnosticEntry.message,
    severity
  );
  diagnostic.code = cmsDiagnosticEntry.code;
  diagnostic.source = "CMS-Backend Template Extension";
  diagnostic.tags = [vscode.DiagnosticTag.Unnecessary];
  return diagnostic;
}

export function subscribeToDocumentChanges(
  context: vscode.ExtensionContext,
  cmsDiagnostics: vscode.DiagnosticCollection
): void {
  if (vscode.window.activeTextEditor) {
    refreshDiagnostics(vscode.window.activeTextEditor.document, cmsDiagnostics);
  }
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        refreshDiagnostics(editor.document, cmsDiagnostics);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) =>
      refreshDiagnostics(e.document, cmsDiagnostics)
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) =>
      cmsDiagnostics.delete(doc.uri)
    )
  );
}
