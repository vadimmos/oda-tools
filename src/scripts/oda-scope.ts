import * as vscode from 'vscode';
import { findOdaComponentDefinition } from './oda-component';

const odaDefinitionRegExp = /function ODA\(/;

let odaUri: vscode.Uri | undefined = undefined;
let odaDoc: vscode.TextDocument | undefined = undefined;
let odaDocRange: vscode.Range | undefined = undefined;

export async function getOdaDefinition() {
  odaUri = odaUri || (await vscode.workspace.findFiles(`**/oda/oda.js`)).find(Boolean);
  if (odaUri) {
    odaDoc = odaDoc || await vscode.workspace.openTextDocument(odaUri);
    if (odaDoc) {
      if (!odaDocRange) {
        //вынести в отдельную функцию
        for (let l = 0; l < odaDoc.lineCount; l++) {
          const res = odaDoc.lineAt(l).text.match(odaDefinitionRegExp);
          if (res) {
            odaDocRange = new vscode.Range(new vscode.Position(l, 0), new vscode.Position(l, odaDoc.lineAt(l).text.trim().length));
            break;
          }
        }
      }
      if (odaDocRange) {
        return new vscode.Location(odaUri, odaDocRange);
      }
    }
  }
}

const propsMap: { [key: string]: vscode.Location } = {};

export async function getOdaSubPropertyDefinition(name: string, document: vscode.TextDocument, position: vscode.Position) {
  await getOdaDefinition();
  if (odaUri && odaDoc) {
    if (propsMap[name]) {
      return propsMap[name];
    } else {
      if (name.startsWith('show') && name !== 'show') {
        return findOdaComponentDefinition(document, position, `oda-${name.toLowerCase().replace('show', '')}`);
      } else {
        const expr = getOdaPropDefRegExp(name);
        let range;
        for (let l = 0; l < odaDoc.lineCount; l++) {
          const res = odaDoc.lineAt(l).text.match(expr);
          if (res) {
            range = new vscode.Range(new vscode.Position(l, 0), new vscode.Position(l, odaDoc.lineAt(l).text.trim().length));
            break;
          }
        }
        if (range) {
          propsMap[name] = new vscode.Location(odaUri, range);
          return propsMap[name];
        }
      }

    }
  }
}

function getOdaPropDefRegExp(name: string) {
  // if (name.startsWith('show') && name !== 'show') {
  //   return new RegExp(`(?<=ODA)\\[\\('show\\-' \\+ id\\)\\.toCamelCase\\(\\)\\]\\s+(?=[=])`);
  // } else {
    return new RegExp(`(?<=ODA\\.)${name}\\s+(?=[=])`);
  // }
}