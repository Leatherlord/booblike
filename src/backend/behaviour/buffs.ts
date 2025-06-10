import { Character } from './character';

export enum TargetType {
  Self = 'SELF',
  Enemy = 'ENEMY',
  Random = 'RANDOM',
}

export enum StatType {
  Health = 'HEALTH',
  Attack = 'ATTACK',
  Speed = 'SPEED',
}

export enum ModifierType {
  Flat = 'FLAT',
  Add = 'ADD',
  Mult = 'MULT',
}

interface Effect {
  name: string;
  targetType: TargetType;
  // those three are only applicable to certain types of effects
  statType?: StatType;
  modifierType?: ModifierType;
  value?: number;
  applyEffect: () => void;
}

export interface Buff {
  name: string;
  duration: number;
  maxStacks: number;
  effect: Effect;
  apply: (to: Character) => void;
}
