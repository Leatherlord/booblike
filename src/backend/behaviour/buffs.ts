import { World, Entity } from '../../common/interfaces';
import { Character, Characteristics } from './character';

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

interface Bonus {
  name: string;
  statType: StatType;
  attributeType?: keyof Characteristics;
  modifierType: ModifierType;
  value: number;
}

interface Effect {
  name: string;
  applyEffect: (world: World, entity: Entity) => void;
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
}

export let HealthBonus: Bonus = {
  name: 'Health Up stats',
  statType: StatType.Health,
  modifierType: ModifierType.Mult,
  value: 10,
};

export let AttributeBonus: Bonus = {
  name: 'Attribute Up stats',
  statType: StatType.Attribute,
  attributeType: 's',
  modifierType: ModifierType.Flat,
  value: 4,
};

export let SimpleAttributeBuff: Buff = {
  name: 'SimpleAttributeBuff',
  targetType: TargetType.Self,
  duration: {
    duration: 2500,
    type: 'Temporary',
  },
  effect: AttributeBonus,
};

export let SimpleHealthBuff: Buff = {
  name: 'SimpleHealthBuff',
  targetType: TargetType.Self,
  duration: {
    duration: 3000,
    type: 'Temporary',
  },
  effect: HealthBonus,
};

export let Duplication: Effect = {
  name: 'Duplication',
  applyEffect: (world: World, entity: Entity) => {
    console.log(`${entity} is duplicating in`, world);
  },
};

export let Fury: Effect = {
  name: 'Fury',
  applyEffect: (world: World, entity: Entity) => {
    console.log(`${entity} is enraged in`, world);
  },
};

export let Furry: Effect = {
  name: 'Become a Furry',
  applyEffect: (world: World, entity: Entity) => {
    console.log(`${entity} is now a furry`);
  },
};

export let Pacify: Effect = {
  name: 'Pacify',
  applyEffect: (world: World, entity: Entity) => {
    console.log(`${entity} is pacified in`, world);
  },
};

export let Stun: Effect = {
  name: 'Stun',
  applyEffect: (world: World, entity: Entity) => {
    console.log(`${entity} is stunned in`, world);
  },
};
