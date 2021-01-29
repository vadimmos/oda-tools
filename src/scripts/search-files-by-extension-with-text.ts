import * as vscode from 'vscode';
import * as Path from 'path';
import { TextDecoder } from 'util';

const excludes = [
  ...Object.keys(vscode.workspace.getConfiguration('search', null).get('exclude') || {}),
  ...Object.keys(vscode.workspace.getConfiguration('files', null).get('exclude') || {})
].join(',');

export async function searchFilesByExtensionWithText(folder: vscode.Uri, ext?: string | string[], expr?: string | RegExp) {
  ext = Array.isArray(ext) ? ext.map(e => `*/**/*${e}`).join(',') : `*/**/*${ext}`;

  const res: vscode.Uri[] = [];

  const uries = await vscode.workspace.findFiles(`{${ext}}`, `{${excludes}}`);
  const datas = await Promise.all(uries.map(async uri =>
    ({ uri, text: new TextDecoder("utf-8").decode(await vscode.workspace.fs.readFile(uri)) }))// (await vscode.workspace.openTextDocument(u)).getText()
  );
  for (const d of datas) {
    if ((expr instanceof RegExp && d.text.match(expr)) || (typeof expr === 'string' && d.text.includes(expr))) {
      res.push(d.uri);
    }
    // const doc = await vscode.workspace.openTextDocument(u);
    // if ((expr instanceof RegExp && doc.getText().match(expr)) || (typeof expr === 'string' && doc.getText().includes(expr))) {
    //   res.push(u);
    // }
  }

  return res;
}