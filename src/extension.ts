// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import { ODADefinitionProvider } from './scripts/ODADefinitionProvider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'javascript' }, new ODADefinitionProvider()));
}

export function deactivate() { }
