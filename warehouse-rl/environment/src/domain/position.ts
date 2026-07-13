import type { Position } from './types.js';

export function positionsEqual(left: Position, right: Position): boolean {
  return left.x === right.x && left.y === right.y;
}

export function positionKey(position: Position): string {
  return `${String(position.x)},${String(position.y)}`;
}

export function movePosition(position: Position, delta: Position): Position {
  return {
    x: position.x + delta.x,
    y: position.y + delta.y,
  };
}
