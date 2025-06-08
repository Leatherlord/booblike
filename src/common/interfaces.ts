import { Dictionary } from "typescript-collections";
import { Character } from "../backend/behaviour/character";

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
  entities: Record<string, Entity[]>; // rewrite everything to support numtiple entitied in one
}

export type EntityDict = {
  map: Tile[][];
  exits: Dictionary<Point2d, number | undefined>;
  reverseExits: Dictionary<number, Point2d>;
  entities: Record<string, Entity[]>; // rewrite everything to support numtiple entitied in one 
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
