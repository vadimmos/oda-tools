import * as vscode from 'vscode';
import { findOdaComponentDefinition } from './oda-component';
import { getOdaDefinition, getOdaSubPropertyDefinition } from './oda-scope';


const odaRegExp = /ODA[(\.]/;
const odaPropRegExp = /(?<=ODA\.)[^\.\s\(]*(?=[\(\.])/;
export class ODADefinitionProvider implements vscode.DefinitionProvider {
  public async provideDefinition( 
    document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken
  ): Promise<vscode.Location | undefined> {
    if (document.getWordRangeAtPosition(position, odaRegExp)) {
      return getOdaDefinition();
    }
    const subProperty = document.getWordRangeAtPosition(position, odaPropRegExp);
    if (subProperty){
      return getOdaSubPropertyDefinition(document.getText(subProperty), document, position, token);
    }
    return findOdaComponentDefinition(document, position, undefined, token);
  }
}