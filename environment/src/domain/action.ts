import { ACTIONS, type Action } from './types.js';

const actionSet: ReadonlySet<string> = new Set(ACTIONS);

export function isAction(value: unknown): value is Action {
  return typeof value === 'string' && actionSet.has(value);
}

export function parseAction(value: unknown): Action {
  if (!isAction(value)) {
    throw new Error(`Unsupported warehouse action: ${String(value)}`);
  }

  return value;
}
