import { Dictionary } from 'typescript-collections';

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

export type Room = {
  map: Tile[][];
  exits: Dictionary<Point2d, number | undefined>;
  reverseExits: Dictionary<number, Point2d>;
};

export type Tile = 'empty' | 'wall' | 'floor' | 'door';

export type Entity = {
  id?: string;
  x: number;
  y: number;
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
