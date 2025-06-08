import { Dictionary } from "typescript-collections";
import { Character } from "../backend/behaviour/character";
import { pointToKey } from "../frontend/utils/utils";

export type World = {
  map: GameMap;
  entities: Entity[];
  player: Entity & Inventory;
  random: any;
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
}

export type Room = {
  map: Tile[][];
  exits: Dictionary<Point2d, number | undefined>;
  reverseExits: Dictionary<number, Point2d>;
  entities: EntitiesMap;
}

export class EntitiesMap {
  constructor() {
    this.entities = {};
    this.size = 0;
  }
  
  add(pos: Point2d, entity: Entity) {
    const posStr: string = pointToKey(pos);
    if(!this.entities[posStr]) {
      this.entities[posStr] = new Set();
    }
    this.entities[posStr].add(entity);
    this.size += 1;
  }

  delete(pos: Point2d, entity: Entity) {
    const posStr: string = pointToKey(pos);
    if(!this.entities[posStr]) return;
    this.entities[posStr].delete(entity);
    this.size -= 1;
    if(this.entities[posStr].size == 0) {
      delete this.entities[posStr];
    }
  }

  get(pos: Point2d) {
    return this.entities[pointToKey(pos)];
  }

  forEach(callback: (entity: Entity, posString: string) => void) {
    for (const [posStr, entitiesSet] of Object.entries(this.entities)) {
      entitiesSet.forEach(entity => callback(entity, posStr));
    }
  }

  entities: Record<string, Set<Entity>>;
  size: number
}


export type Tile = 'empty' | 'wall' | 'floor' | 'door';

export enum LookDirection {
  Up = "UP",
  Down = "DOWN",
  Left = "LEFT",
  Right = "RIGHT"
}

export type Entity = {
  id?: string;
  x: number;
  y: number;
  lookDir: LookDirection;
  character: Character;
  lastAttackArray?: Point2d[];

  texture?: string; 
  level: number;
};

export type InventoryItem = {
  id: string;
  name: string;
  icon?: string;
  description?: string;
};

export type InventorySlot = {
  id: number;
  item?: InventoryItem;
};

export type Inventory = {
  slots: InventorySlot[];
  activeSlot: number;
};
