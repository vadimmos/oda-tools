import * as vscode from 'vscode';
import { searchFilesByExtensionWithText } from './search-files-by-extension-with-text';

import * as RE from './regExps';

const COMPONENTS_CACHE: Map<string, OdaComponent> = new Map;

export async function findOdaComponentDefinition(document: vscode.TextDocument, position: vscode.Position, name?: string, token?: vscode.CancellationToken) {
  const range = getRange(document, position);
  if (!name) {
    if (range) {
      const idExpr = document.getText(range);
      name = (idExpr.split('/')[1] || idExpr).replace(RE.odaPrefix, '');
    }
  }
  if (name) {
    if (name === 'this') { return undefined; }
    const cpt = await findOdaComponent(name, document, token);
    if(cpt){
      return [new LocLink(cpt.location.uri, cpt.location.range, range)];
    }
  }
}

function getRange(document: vscode.TextDocument, position: vscode.Position) {
  return [
    document.getWordRangeAtPosition(position, RE.importing),
    document.getWordRangeAtPosition(position, RE.htmlTag),
    document.getWordRangeAtPosition(position, RE.extending)
  ].find(Boolean);
}

export async function findOdaComponent(name: string, document?: vscode.TextDocument, token?: vscode.CancellationToken) {
  const cpt = await getOdaComponent(name);
  if (cpt) { return cpt; }
  if (document) {
    const loc = await getDefLocation([document.uri], name);
    if (loc) {
      return getOdaComponent(name, loc);
    }
  }
  const uries = await vscode.workspace.findFiles(`**/${name}/${name}.js`, undefined, undefined, token);
  const loc = await getDefLocation(uries, name);
  if (loc) {
    return getOdaComponent(name, loc);
  } else if (vscode.workspace.workspaceFolders) {
    const uries = [];
    for (const f of vscode.workspace.workspaceFolders) {
      if (token?.isCancellationRequested) {
        return undefined;
      }
      uries.push(...(await searchFilesByExtensionWithText(f.uri, '.js', RE.getCptDefRegExpFull(name))));
    }
    const loc = await getDefLocation(uries, name);
    if (loc) {
      return getOdaComponent(name, loc);
    }
  }
}
export async function getDefLocation(uries: vscode.Uri[], name: string, token?: vscode.CancellationToken) {
  for (const uri of uries) {
    if (token?.isCancellationRequested) {
      return undefined;
    }
    const doc = await vscode.workspace.openTextDocument(uri);
    let range = doc.getWordRangeAtPosition(new vscode.Position(0, 0), RE.getCptDefRegExpFull(name));
    if (!range && doc.getText().match(RE.getCptDefRegExpFull(name))) {
      for (let l = 0; l < doc.lineCount; l++) {
        const res = doc.lineAt(l).text.match(RE.getCptDefRegExpShort(name));
        if (res) {
          range = new vscode.Range(new vscode.Position(l, 0), new vscode.Position(l, doc.lineAt(l).text.trim().length));
          break;
        }
      }
    }
    if (range) { return new vscode.Location(uri, range); }
  }
}
export function getOdaComponent(name: string, location?: vscode.Location) {
  if (!COMPONENTS_CACHE.get(name) && location) {
    COMPONENTS_CACHE.set(name, new OdaComponent(name, location));
  }
  return COMPONENTS_CACHE.get(name);
}

export class OdaComponent {
  constructor(name: string, location: vscode.Location) {
    this.name = name;
    this.location = location;
  }
  name: string;
  location: vscode.Location;
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

class LocLink implements vscode.LocationLink{
  originSelectionRange?: vscode.Range;
  targetUri: vscode.Uri;
  targetRange: vscode.Range;
  targetSelectionRange?: vscode.Range;
  constructor(targetUri: vscode.Uri, targetRange: vscode.Range, originSelectionRange?: vscode.Range, targetSelectionRange?: vscode.Range){
    this.originSelectionRange = originSelectionRange;
    this.targetUri = targetUri;
    this.targetRange = targetRange;
    this.targetSelectionRange = targetSelectionRange;
  }
}