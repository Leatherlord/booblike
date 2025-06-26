import { InventoryItem, ItemType, Grid } from '../../common/interfaces';
import { BUFFS } from './buffs';
import { Buff, TargetType } from '../behaviour/buffs';
import { generateGrid } from '../../common/interfaces';

export const HEALTH_POTION: InventoryItem = {
  id: 'health_potion',
  name: 'Health Potion',
  type: ItemType.Consumable,
  icon: '❤',
  effect: [BUFFS.InstantHeal],
  targetType: TargetType.Self,
};

export const STRENGTH_POTION: InventoryItem = {
  id: 'strength_potion',
  name: 'Potion of Strength',
  type: ItemType.Consumable,
  icon: '💪',
  effect: [BUFFS.strengthBuff],
  targetType: TargetType.Self,
};

export const FIREBALL_SCROLL: InventoryItem = {
  id: 'scroll_fireball',
  name: 'Scroll of Fireball',
  type: ItemType.Scroll,
  icon: '🔥',
  effect: [BUFFS.burnEffect, BUFFS.instant_damage],
  targetType: TargetType.Enemy,
  area: { areaUp: 3, areaDown: 3, areaLeft: 3, areaRight: 3 },
};

export const TELEPORT_SCROLL: InventoryItem = {
  id: 'scroll_teleport',
  name: 'Scroll of Teleportation',
  icon: '🌀',
  type: ItemType.Scroll,
  targetType: TargetType.Self,
};

export const ITEMS: Record<string, InventoryItem> = {
  HealthPotion: HEALTH_POTION,
  StengthPotion: STRENGTH_POTION,
  FireballScroll: FIREBALL_SCROLL,
  TeleportScroll: TELEPORT_SCROLL,
};
