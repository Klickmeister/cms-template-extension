import * as vscode from "vscode";

interface CmsContainer {
  isBeingBuilt: boolean;
  isComplete: boolean;
  attributes: { attribute: string; lineIndex: number }[];
  range?: vscode.Range;
}

export { CmsContainer };
