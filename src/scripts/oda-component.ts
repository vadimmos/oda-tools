import * as vscode from 'vscode';
import { searchFilesByExtensionWithText } from './search-files-by-extension-with-text';

const importsRegExp = /(?<=['"])@[^@]*\/[^@"',]*(?=['"]\s*(, ?)?)/;
const htmlTagRegExp = /(?<=<)[\w\d-]*(?= )/;
const extendsRegExp = /((?<=extends\s*:\s*["']|(,\s*))[^, '"]*(?=["']|(,\s*)))/;
const odaPrefixRegExp = /^(oda(nt)?-)/;

const COMPONENTS_CACHE = new Map;
const CP_REG_EXP_FULL_CACHE = new Map;
const CP_REG_EXP_SHORT_CACHE = new Map;

function getCpRegExpFull(name: string) {
  if (!CP_REG_EXP_FULL_CACHE.get(name)) {
    CP_REG_EXP_FULL_CACHE.set(name, new RegExp(`(?<=oda(nt)?\\s*\\(\\s*{\\s*is\\s*:\\s*['"])(oda(nt)?-)?${name}(?=["']\\s*,)`, 'ig'));
  }
  return CP_REG_EXP_FULL_CACHE.get(name);
}
function getCpRegExpShort(name: string) {
  if (!CP_REG_EXP_SHORT_CACHE.get(name)) {
    CP_REG_EXP_SHORT_CACHE.set(name, new RegExp(`(?<=is\\s*:\\s*['"])(oda(nt)?-)?${name}(?=["']\\s*,)`, 'ig'));
  }
  return CP_REG_EXP_SHORT_CACHE.get(name);
}

export async function findOdaComponentDefinition(document: vscode.TextDocument, position: vscode.Position, cmpName?: string) {
  if (!cmpName) {
    const range = [
      document.getWordRangeAtPosition(position, importsRegExp),
      document.getWordRangeAtPosition(position, htmlTagRegExp),
      document.getWordRangeAtPosition(position, extendsRegExp)
    ].find(Boolean);
    if (range) {
      const idExpr = document.getText(range);
      cmpName = (idExpr.split('/')[1] || idExpr).replace(odaPrefixRegExp, '');
      if (cmpName === 'this') { return undefined; }
      const cpt = await findOdaComponent(cmpName, document);
      return cpt ? cpt.location : undefined;
    }
  }
  if (cmpName) {
    if (cmpName === 'this') { return undefined; }
    const cpt = await findOdaComponent(cmpName, document);
    return cpt ? cpt.location : undefined;
  }
}

export async function findOdaComponent(name: string, fromDocument?: vscode.TextDocument): Promise<OdaComponent | undefined> {
  const cpt = await getOdaComponent(name);
  if (cpt) { return cpt; }
  if (fromDocument) {
    const res = await getRangeInUries([fromDocument.uri], name);
    if (res && res.range && res.uri) {
      return getOdaComponent(name, new vscode.Location(res.uri, res.range));
    }
  }
  const uries = await vscode.workspace.findFiles(`**/${name}/${name}.js`);
  const res = await getRangeInUries(uries, name);
  if (res && res.range && res.uri) {
    return getOdaComponent(name, new vscode.Location(res.uri, res.range));
  } else if (vscode.workspace.workspaceFolders) {
    const uries = [];
    for (const f of vscode.workspace.workspaceFolders) {
      uries.push(...(await searchFilesByExtensionWithText(f.uri, '.js', getCpRegExpFull(name))));
    }
    const res = await getRangeInUries(uries, name);
    if (res && res.range && res.uri) {
      return getOdaComponent(name, new vscode.Location(res.uri, res.range));
    }
  }

  // const cpRegExpFull = new RegExp(`(?<=oda(nt)?\\s*\\(\\s*{\\s*is\\s*:\\s*['"])(oda(nt)?-)?${cmpName}(?=["']\\s*,)`, 'ig');
  // const cpRegExpShort = new RegExp(`(?<=is\\s*:\\s*['"])(oda(nt)?-)?${cmpName}(?=["']\\s*,)`, 'ig');
  // const possibleUries = fromDocument ? [fromDocument.uri] : [];
  // possibleUries.push(...(await vscode.workspace.findFiles(`**/${cmpName}/${cmpName}.js`)));

  // if (possibleUries.length <= 1 && vscode.workspace.workspaceFolders) {
  //   for (const f of vscode.workspace.workspaceFolders) {
  //     possibleUries.push(...(await searchFilesByExtensionWithText(f.uri, '.js', cpRegExpFull)));
  //   }
  // }

  // for (const uri of possibleUries) {
  //   const doc = await vscode.workspace.openTextDocument(uri);
  //   let range = doc.getWordRangeAtPosition(new vscode.Position(0, 0), cpRegExpFull);
  //   if (doc.getText().match(cpRegExpFull)) {
  //     for (let l = 0; l < doc.lineCount; l++) {
  //       const res = doc.lineAt(l).text.match(cpRegExpShort);
  //       if (res) {
  //         range = new vscode.Range(new vscode.Position(l, 0), new vscode.Position(l, doc.lineAt(l).text.trim().length));
  //         break;
  //       }
  //     }
  //   }
  //   if (range) { return getOdaComponent(cmpName, new vscode.Location(uri, range), doc); }
  // }
  // throw new Error(`component: "${cmpName}" is not defined`);

}
export async function getRangeInUries(possibleUries: vscode.Uri[], name: string) {
  for (const uri of possibleUries) {
    const doc = await vscode.workspace.openTextDocument(uri);
    let range = doc.getWordRangeAtPosition(new vscode.Position(0, 0), getCpRegExpFull(name));
    if (doc.getText().match(getCpRegExpFull(name))) {
      for (let l = 0; l < doc.lineCount; l++) {
        const res = doc.lineAt(l).text.match(getCpRegExpShort(name));
        if (res) {
          range = new vscode.Range(new vscode.Position(l, 0), new vscode.Position(l, doc.lineAt(l).text.trim().length));
          break;
        }
      }
    }
    if (range) { return { range, uri }; }
  }
}
export function getOdaComponent(name: string, location?: vscode.Location, document?: vscode.TextDocument) {
  if (!COMPONENTS_CACHE.get(name) && location) {
    COMPONENTS_CACHE.set(name, new OdaComponent(name, location, document));
  }
  return COMPONENTS_CACHE.get(name);
}

export class OdaComponent {
  constructor(name: string, location: vscode.Location, document?: vscode.TextDocument) {
    this.name = name;
    this.location = location;
    if (document) {
      this.document = document;
    }
  }
  name: string;
  location: vscode.Location;
  document: vscode.TextDocument | null = null;
  methods: string[] = [];
  props: string[] = [];
  static events: string[] = ['tap', 'track', 'abort', 'blur', 'cancel', 'canplay', 'canplaythrough', 'change', 'click', 'close', 'contextmenu', 'cuechange', 'dblclick', 'drag', 'dragend', 'dragenter', 'dragleave', 'dragover', 'dragstart', 'drop', 'durationchange', 'emptied', 'ended', 'error', 'focus', 'formdata', 'input', 'invalid', 'keydown', 'keypress', 'keyup', 'load', 'loadeddata', 'loadedmetadata', 'loadstart', 'mousedown', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'mousewheel', 'pause', 'play', 'playing', 'progress', 'ratechange', 'reset', 'resize', 'scroll', 'seeked', 'seeking', 'select', 'stalled', 'submit', 'suspend', 'timeupdate', 'toggle', 'volumechange', 'waiting', 'webkitanimationend', 'webkitanimationiteration', 'webkitanimationstart', 'webkittransitionend', 'wheel', 'auxclick', 'gotpointercapture', 'lostpointercapture', 'pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'pointerover', 'pointerout', 'pointerenter', 'pointerleave', 'selectstart', 'selectionchange', 'animationend', 'animationiteration', 'animationstart', 'transitionrun', 'transitionstart', 'transitionend', 'transitioncancel', 'copy', 'cut', 'paste', 'pointerrawupdate'];
  static directives = {
    'for': {},
    'if': {},
    'else': {},
    'show': {},
    'style': {},
    'class': {}
  };
}