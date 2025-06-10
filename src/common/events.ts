export type Event =
  | PlayerMoveEvent
  | PlayerAttackEvent
  | InventorySelectEvent
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

export type PurchaseUpgradeEvent = {
  type: 'purchase_upgrade';
  upgradeId: string;
};
