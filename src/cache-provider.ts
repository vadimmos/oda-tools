import * as vscode from 'vscode';
import { CACHE_VERSION, EXTENSION_NAME } from "./constants";

const CACHE_NAME = `${EXTENSION_NAME}_cache`;
let context: vscode.ExtensionContext | null = null;

const cacheProvider = {
  get(key: string | number) {
    throw new Error('Cache is not initialized!!!')
  },
  set(key: string | number, value: any) {
    throw new Error('Cache is not initialized!!!')
  }
}
export function init(context: vscode.ExtensionContext) {
  const cache = context.workspaceState.get(CACHE_NAME, {});
  // cacheProvider.get = function (key: string | number) {
  //   if (key in cache) {
  //     return Object.assign({}, cache[key])
  //   }
  // }
}
