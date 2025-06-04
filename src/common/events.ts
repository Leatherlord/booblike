export type Event = PlayerMoveEvent | PlayerAttackEvent | InventorySelectEvent;

export type PlayerMoveEvent = {
  type: 'player_move';
  direction: 'up' | 'down' | 'left' | 'right';
};

export type PlayerAttackEvent = {
  type: 'player_attack';
  timeStarted: number;
};

export type InventorySelectEvent = {
  type: 'inventory_select';
  slotId: number;
};
