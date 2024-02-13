import * as vscode from "vscode";

interface CmsDiagnosticEntry {
  containerType: string;
  code: string;
  message: string;
  severity: string;
}

export { CmsDiagnosticEntry };
