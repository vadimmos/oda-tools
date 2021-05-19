import * as vscode from 'vscode';
import { ODADefinitionProvider } from './scripts/oda-definition-provider';

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDefinitionProvider({ scheme: 'file', language: 'javascript' }, new ODADefinitionProvider()));
	

	context.subscriptions.push(vscode.commands.registerCommand('oda-tools.Static-server', () => {
		console.log('ODA Static server');
	}));

	console.log('"oda-tools" is now active!');
}

export function deactivate() { }
