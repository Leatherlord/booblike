export type Event = PlayerMoveEvent | PlayerAttackEvent;

export type PlayerMoveEvent = {
  type: 'player_move';
  direction: 'up' | 'down' | 'left' | 'right';
};

export type PlayerAttackEvent = {
  type: 'player_attack';
  direction: 'up' | 'down' | 'left' | 'right';
};
