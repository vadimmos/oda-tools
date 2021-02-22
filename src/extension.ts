import * as vscode from 'vscode';
import { ODADefinitionProvider } from './scripts/oda-definition-provider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'javascript' }, new ODADefinitionProvider()));
	console.log('"oda-tools" is now active!');
}

export function deactivate() { }
