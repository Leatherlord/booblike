import { World, Entity } from '../../common/interfaces';
import { Character, Characteristics } from './character';

function chanceToApplyBuff() {}

export enum TargetType {
  Self = 'SELF',
  Enemy = 'ENEMY',
  Random = 'RANDOM',
}

export enum StatType {
  Health = 'HEALTH',
  Attack = 'ATTACK',
  Attribute = 'ATTRIBUTE',
}

export enum ModifierType {
  Flat = 'FLAT',
  Mult = 'MULT',
}

export type Duration = {
  duration: number;
  type: 'Temporary' | 'Permanent';
};

export interface Bonus {
  name: string;
  statType: StatType;
  attributeType?: keyof Characteristics;
  modifierType: ModifierType;
  value: number;
}

export interface Effect {
  name: string;
  applyEffect: string;
}

export function isBonus(effect: Effect | Bonus): effect is Bonus {
  return (effect as Bonus).modifierType !== undefined;
}

export function isEffect(effect: Effect | Bonus): effect is Effect {
  return (effect as Effect).applyEffect !== undefined;
}

export interface Buff {
  name: string;
  targetType: TargetType;
  duration: Duration;
  effect: Effect | Bonus;
  chanceToApply: number;
}
