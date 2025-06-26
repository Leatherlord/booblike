import { Effect } from '../behaviour/buffs';

export const FURY_EFFECT: Effect = {
  name: 'Fury',
  applyEffect: 'furyEffect',
};

export const PACIFY_EFFECT: Effect = {
  name: 'Pacify',
  applyEffect: 'pacifyEffect',
};

export const STUN_EFFECT: Effect = {
  name: 'Stun',
  applyEffect: 'stunEffect',
};

export const FURRY_EFFECT: Effect = {
  name: 'Become a Furry',
  applyEffect: 'furryEffect',
};

export const BURN_EFFECT: Effect = {
  name: 'Burn Witcher Burn',
  applyEffect: 'burnEffect',
};

export const EFFECTS: Record<string, Effect> = {
  Fury: FURY_EFFECT,
  Pacify: PACIFY_EFFECT,
  Stun: STUN_EFFECT,
  Furry: FURRY_EFFECT,
  Burn: BURN_EFFECT,
};

export function getEffect(name: string): Effect | undefined {
  return EFFECTS[name];
}
