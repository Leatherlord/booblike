import { Instant } from '../behaviour/buffs';

export const INSTANT_HEAL: Instant = {
  name: 'instant_heal',
  heal: 50,
};

export const INSTANT_DAMAGE: Instant = {
  name: 'instant_damage',
  heal: 50,
};

export const INSTANTS: Record<string, Instant> = {
  Heal: INSTANT_HEAL,
  Damage: INSTANT_DAMAGE,
};
