import { Point2d } from './interfaces';

export type Event =
  | PlayerMoveEvent
  | PlayerAttackEvent
  | InventorySelectEvent
  | InventoryUseEvent
  | PurchaseUpgradeEvent;

export type PlayerMoveEvent = {
  type: 'player_move';
  direction: 'up' | 'down' | 'left' | 'right';
};

export type PlayerAttackEvent = {
  type: 'player_attack';
  weaponChosen: number;
};

export type InventorySelectEvent = {
  type: 'inventory_select';
  slotId: number;
};

export type InventoryUseEvent = {
  type: 'inventory_use';
  slotId: number;
  target?: Point2d;
};

export type PurchaseUpgradeEvent = {
  type: 'purchase_upgrade';
  upgradeId: string;
};
