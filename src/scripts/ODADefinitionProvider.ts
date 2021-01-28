import * as vscode from 'vscode';
const importsRegExp = /(?<=['"])@.*\/.*(?=['"])/;
const htmlTagRegExp = /(?<=<)[\w\d-]*(?= )/;
const odaPrefixRegExp = /^(oda(nt)?-)/;
export class ODADefinitionProvider implements vscode.DefinitionProvider {
  public async provideDefinition(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Location> {
    const importsRange = document.getWordRangeAtPosition(position, importsRegExp);
    const htmlTagRange = document.getWordRangeAtPosition(position, htmlTagRegExp);
    const text = document.getText(importsRange || htmlTagRange);

    const cmpName = (text.split('/')[1] || text).replace(odaPrefixRegExp, '');
    const targetFile = await vscode.workspace.findFiles(`**/${cmpName}/${cmpName}.js`);
    const targetPath = targetFile[0]?.fsPath;

    return new vscode.Location(vscode.Uri.file(targetPath), new vscode.Position(0, 0));
  }
}