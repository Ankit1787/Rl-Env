import { positionKey } from './position.js';
import type { Position, WarehouseLayout } from './types.js';

export class Grid {
  private readonly wallKeys: ReadonlySet<string>;

  constructor(private readonly layout: WarehouseLayout) {
    this.wallKeys = new Set(layout.walls.map(positionKey));
    this.validateLayout();
  }

  isInside(position: Position): boolean {
    return (
      Number.isInteger(position.x) &&
      Number.isInteger(position.y) &&
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < this.layout.width &&
      position.y < this.layout.height
    );
  }

  isWall(position: Position): boolean {
    return this.wallKeys.has(positionKey(position));
  }

  isWalkable(position: Position): boolean {
    return this.isInside(position) && !this.isWall(position);
  }

  private validateLayout(): void {
    const namedPositions = [
      { name: 'robotStart', position: this.layout.robotStart },
      { name: 'boxStart', position: this.layout.boxStart },
      { name: 'goalPosition', position: this.layout.goalPosition },
    ];

    for (const { name, position } of namedPositions) {
      if (!this.isInside(position)) {
        throw new Error(`${name} must be inside the grid`);
      }

      if (this.isWall(position)) {
        throw new Error(`${name} cannot be placed on a wall`);
      }
    }

    for (const wall of this.layout.walls) {
      if (!this.isInside(wall)) {
        throw new Error(`wall ${positionKey(wall)} must be inside the grid`);
      }
    }
  }
}
