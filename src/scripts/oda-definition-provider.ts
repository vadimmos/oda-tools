import * as vscode from 'vscode';
import { findOdaComponent } from './oda-component';

const importsRegExp = /(?<=['"])@[^@]*\/[^@"',]*(?=['"]\s*(, ?)?)/;
const htmlTagRegExp = /(?<=<)[\w\d-]*(?= )/;
const extendsRegExp = /((?<=extends\s*:\s*["']|(,\s*))[^, '"]*(?=["']|(,\s*)))/;
const odaPrefixRegExp = /^(oda(nt)?-)/;

export class ODADefinitionProvider implements vscode.DefinitionProvider {
  public async provideDefinition(
    document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken
  ): Promise<vscode.Location | undefined> {
    let range = [
      document.getWordRangeAtPosition(position, importsRegExp),
      document.getWordRangeAtPosition(position, htmlTagRegExp),
      document.getWordRangeAtPosition(position, extendsRegExp)
    ].find(Boolean);
    if (range) {
      const idExpr = document.getText(range);
      const cmpName = (idExpr.split('/')[1] || idExpr).replace(odaPrefixRegExp, '');
      if (cmpName === 'this') { return undefined; }
      const cpt = await findOdaComponent(cmpName, document);
      return cpt ? cpt.location : undefined;
    }
  }
}