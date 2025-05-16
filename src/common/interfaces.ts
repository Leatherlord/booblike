export type World = {
  width: number;
  height: number;
  map: Tile[][];
  entities: Entity[];
  player: Entity & Inventory;
};

export type Tile = 'empty' | 'wall' | 'floor' | 'door';

export type Entity = {
  id?: string;
  x: number;
  y: number;
};

export type Inventory = {};
