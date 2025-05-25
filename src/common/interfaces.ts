export type World = {
  width: number;
  height: number;
  map: GameMap;
  entities: Entity[];
  player: Entity & Inventory;
};

export type GameMap = {
  rooms: Room[]
  currentRoom: number
};

export type Point2d = {
  x: number;
  y: number;
}

export type Room = {
  map: Tile[][];
  exits: Map<Point2d, number | undefined>;
}

export type Tile = 'empty' | 'wall' | 'floor' | 'door';

export type Entity = {
  id?: string;
  x: number;
  y: number;
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
