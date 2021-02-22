import * as vscode from 'vscode';
import { searchFilesByExtensionWithText } from './search-files-by-extension-with-text';

import * as RE from './regExps';

const COMPONENTS_CACHE: Map<string, OdaComponent> = new Map;

export async function findOdaComponentDefinition(document: vscode.TextDocument, position: vscode.Position, name?: string) {
  if (!name) {
    const range = getRange(document, position);
    if (range) {
      const idExpr = document.getText(range);
      name = (idExpr.split('/')[1] || idExpr).replace(RE.odaPrefix, '');
    }
  }
  if (name) {
    if (name === 'this') { return undefined; }
    const cpt = await findOdaComponent(name, document);
    return cpt ? cpt.location : undefined;
  }
}

function getRange(document: vscode.TextDocument, position: vscode.Position) {
  return [
    document.getWordRangeAtPosition(position, RE.importing),
    document.getWordRangeAtPosition(position, RE.htmlTag),
    document.getWordRangeAtPosition(position, RE.extending)
  ].find(Boolean);
}

export async function findOdaComponent(name: string, document?: vscode.TextDocument) {
  const cpt = await getOdaComponent(name);
  if (cpt) { return cpt; }
  if (document) {
    const res = await getRangeInUries([document.uri], name);
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
      uries.push(...(await searchFilesByExtensionWithText(f.uri, '.js', RE.getCptDefRegExpFull(name))));
    }
    const res = await getRangeInUries(uries, name);
    if (res && res.range && res.uri) {
      return getOdaComponent(name, new vscode.Location(res.uri, res.range));
    }
  }
}
export async function getRangeInUries(uries: vscode.Uri[], name: string) {
  for (const uri of uries) {
    const doc = await vscode.workspace.openTextDocument(uri);
    let range = doc.getWordRangeAtPosition(new vscode.Position(0, 0), RE.getCptDefRegExpFull(name));
    if (!range &&doc.getText().match(RE.getCptDefRegExpFull(name))) {
      for (let l = 0; l < doc.lineCount; l++) {
        const res = doc.lineAt(l).text.match(RE.getCptDefRegExpShort(name));
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