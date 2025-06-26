import { Dictionary } from 'typescript-collections';
import { Character, Characteristics } from '../backend/behaviour/character';
import { Attack } from '../backend/behaviour/attacks';
import { Buff, TargetType } from '../backend/behaviour/buffs';

export type FloatingText = {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'damage' | 'miss' | 'critical' | 'buff' | 'debuff';
  color: string;
  startTime: number;
  duration: number;
};

export type World = {
  map: GameMap;
  player: Entity & Inventory & LevelingData;
  random: any;
  onEntityDeath?: (deadEntity: Entity, attacker: Entity) => void;
  availableUpgrades: UpgradeOption[];
  isPlayerDead?: boolean;
  floatingTexts?: FloatingText[];
  onCreateFloatingText?: (
    x: number,
    y: number,
    text: string,
    type: 'damage' | 'miss' | 'critical' | 'buff' | 'debuff',
    color?: string
  ) => void;
};

export type ExitMappingEntry = {
  roomId: number;
  exitId: number;
};

export type GameMap = {
  rooms: Room[];
  currentRoom: number;
  exitMapping: Dictionary<ExitMappingEntry, ExitMappingEntry>;
};

export type Point2d = {
  x: number;
  y: number;
};

export type Size = {
  width: number;
  height: number;
};

export type Room = {
  map: Tile[][];
  exits: Dictionary<Point2d, number | undefined>;
  reverseExits: Dictionary<number, Point2d>;
  entities: EntitiesMap;
  items: Map<string, InventoryItem>;
};

function pointToKey(p: Point2d): string {
  return `${p.x},${p.y}`;
}

export function keyToPoint(key: string): Point2d {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export class EntitiesMap {
  constructor() {
    this.entities = {};
  }

  add(pos: Point2d, entity: Entity) {
    const posStr: string = pointToKey(pos);
    if (!this.entities[posStr]) {
      this.entities[posStr] = new Set();
    }
    this.entities[posStr].add(entity);
  }

  delete(pos: Point2d, entity: Entity) {
    const posStr: string = pointToKey(pos);
    if (!this.entities[posStr]) return;
    this.entities[posStr].delete(entity);
    if (this.entities[posStr].size == 0) {
      delete this.entities[posStr];
    }
  }

  get(pos: Point2d) {
    return this.entities[pointToKey(pos)];
  }

  forEach(callback: (entity: Entity, posString: string) => void) {
    for (const [posStr, entitiesSet] of Object.entries(this.entities)) {
      entitiesSet.forEach((entity) => callback(entity, posStr));
    }
  }

  empty() {
    return Object.values(this.entities).length == 0;
  }

  entities: Record<string, Set<Entity>>;
}

export type Tile = 'empty' | 'wall' | 'floor' | 'door';

export enum LookDirection {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

export type Grid = {
  areaUp: number;
  areaDown: number;
  areaRight: number;
  areaLeft: number;
};

export function getGridSize(grid: Grid, direction: LookDirection) {
  const isVertical =
    direction === LookDirection.Up || direction === LookDirection.Down;
  return {
    x: isVertical
      ? grid.areaLeft + grid.areaRight + 1
      : grid.areaUp + grid.areaDown + 1,
    y: isVertical
      ? grid.areaUp + grid.areaDown + 1
      : grid.areaLeft + grid.areaRight + 1,
  };
}

export function getOffsetsByPos(
  lookDir: LookDirection,
  item: { areaSize: Grid }
) {
  let xOffset = 0;
  let yOffset = 0;

  switch (lookDir) {
    case LookDirection.Up:
      xOffset = item.areaSize.areaRight;
      yOffset = item.areaSize.areaDown;
      break;
    case LookDirection.Down:
      xOffset = item.areaSize.areaLeft;
      yOffset = item.areaSize.areaUp;
      break;
    case LookDirection.Left:
      xOffset = item.areaSize.areaDown;
      yOffset = item.areaSize.areaLeft;
      break;
    case LookDirection.Right:
      xOffset = item.areaSize.areaUp;
      yOffset = item.areaSize.areaRight;
      break;
  }
  return {
    x: xOffset,
    y: yOffset,
  };
}

function rotateMatrixRight(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map((row) => row[i]).reverse());
}

function rotateMatrixLeft(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map((row) => row[row.length - 1 - i]));
}

function rotateMatrix180(matrix: number[][]): number[][] {
  return matrix
    .slice()
    .reverse()
    .map((row) => row.slice().reverse());
}

export function generateGrid(
  base: number[][]
): Record<LookDirection, number[][]> {
  return {
    [LookDirection.Up]: rotateMatrix180(base),
    [LookDirection.Right]: rotateMatrixLeft(base),
    [LookDirection.Down]: base,
    [LookDirection.Left]: rotateMatrixRight(base),
  };
}

export type Entity = {
  id?: string;
  x: number;
  y: number;
  lookDir: LookDirection;
  character: Character;
  lastAttackArray?: Point2d[];

  //texture?: string;
  level: number;
  experience: number;
  experienceToNext: number;

  animation: {
    lastAttacked: number;
    lastMoved: number;
  };
};

export enum Speed {
  SUPERFAST = 100,
  FAST = 200,
  NORMAL = 300,
  SLOW = 400,
  SUPERSLOW = 500,
}

export type InventoryItem = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  type?: ItemType;
  characteristicsBonuses?: {
    s?: number;
    p?: number;
    e?: number;
    a?: number;
    i?: number;
  };
  attack?: Attack;
  effect?: Buff[];
  targetType?: TargetType;
  area?: Grid;
};

export enum ItemType {
  Weapon = 'weapon',
  Consumable = 'consumable',
  Quest = 'quest',
  Scroll = 'scroll',
}

export type InventorySlot = {
  id: number;
  item?: InventoryItem;
};

export type Inventory = {
  slots: InventorySlot[];
  activeSlot: number;
};

export type UpgradeOption = {
  id: string;
  name: string;
  description: string;
  characteristic: keyof Characteristics;
  currentLevel: number;
  maxLevel: number;
  cost: number;
};

export type LevelingData = {
  availableExperience: number;
  spentExperience: number;
  upgradesBought: Record<string, number>;
};
