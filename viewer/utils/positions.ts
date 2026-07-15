import type { Position } from '~/types/environment';

export function positionsEqual(left: Position, right: Position): boolean {
  return left.x === right.x && left.y === right.y;
}

export function positionKey(position: Position): string {
  return `${String(position.x)},${String(position.y)}`;
}
