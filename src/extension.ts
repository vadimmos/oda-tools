import * as vscode from 'vscode';
import { CACHE_VERSION, EXTENSION_NAME } from './constants';

export async function activate(context: vscode.ExtensionContext) {

	const defaultData = { [CACHE_VERSION]: {test_data: 0}};
  const CACHE_NAME = `${EXTENSION_NAME}_cache`;
	const cache = context.workspaceState.get(CACHE_NAME, defaultData);

	cache[CACHE_VERSION]['test_data'] = 1;
	await context.workspaceState.update(CACHE_NAME, cache);

	console.log('cache test, value= ', cache[CACHE_VERSION]['test_data'])

	console.log('Congratulations, your extension "oda-tools" is now active!');
	let disposable = vscode.commands.registerCommand('oda-tools.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from oda-tools!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
