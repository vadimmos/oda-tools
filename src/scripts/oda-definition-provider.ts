import * as vscode from 'vscode';
import { findOdaComponent } from './oda-component';
const importsRegExp = /(?<=['"])@.*\/.*(?=['"])/;
const htmlTagRegExp = /(?<=<)[\w\d-]*(?= )/;
const odaPrefixRegExp = /^(oda(nt)?-)/;
export class ODADefinitionProvider implements vscode.DefinitionProvider {
  public async provideDefinition(
    document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken
  ): Promise<vscode.Location | undefined> {
    const cpt = await findOdaComponent(document, position);
    return cpt ? cpt.location : undefined;
  }
}