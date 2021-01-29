import * as vscode from 'vscode';

const CACHE = new Map;

const importsRegExp = /(?<=['"])@[^@]*\/[^@"',]*(?=['"]\s*(, ?)?)/;
const htmlTagRegExp = /(?<=<)[\w\d-]*(?= )/;
const odaPrefixRegExp = /^(oda(nt)?-)/;

export async function findOdaComponent(document: vscode.TextDocument, position: vscode.Position): Promise<OdaComponent | undefined> {
  const importsRange = document.getWordRangeAtPosition(position, importsRegExp);
  const htmlTagRange = document.getWordRangeAtPosition(position, htmlTagRegExp);
  if (!importsRange && !htmlTagRange){
    return;
  }
  const idExpr = document.getText(importsRange || htmlTagRange);
  const cmpName = (idExpr.split('/')[1] || idExpr).replace(odaPrefixRegExp, '');
  const cpRegExpFull = new RegExp(`(?<=oda(nt)?\\s*\\(\\s*{\\s*is\\s*:\\s*['"])(oda(nt)?-)?${cmpName}(?=["']\\s*,)`, 'ig');
  const cpRegExpShort = new RegExp(`(?<=is\\s*:\\s*['"])(oda(nt)?-)?${cmpName}(?=["']\\s*,)`, 'ig');
  const possibleUries = [document.uri, ...(await vscode.workspace.findFiles(`**/${cmpName}/${cmpName}.js`))];

  for (const uri of possibleUries) {
    const doc = await vscode.workspace.openTextDocument(uri);
    let range = doc.getWordRangeAtPosition(new vscode.Position(0, 0), cpRegExpFull);
    if (doc.getText().match(cpRegExpFull)) {
      for (let l = 0; l < doc.lineCount; l++) {
        const res = doc.lineAt(l).text.match(cpRegExpShort);
        if (res) {
          range = new vscode.Range(new vscode.Position(l, 0), new vscode.Position(l, doc.lineAt(l).text.trim().length));
          break;
        }
      }
    }
    if (range) { return getOdaComponent(cmpName, new vscode.Location(uri, range), doc); }
  }
  throw new Error(`component: "${cmpName}" is not defined`);

}
export function getOdaComponent(name: string, location: vscode.Location, document?: vscode.TextDocument) {
  if (!CACHE.get(name)) {
    CACHE.set(name, new OdaComponent(name, location, document));
  }
  return CACHE.get(name);
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