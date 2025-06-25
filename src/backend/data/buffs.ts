import { Buff, TargetType } from '../behaviour/buffs';
import { EFFECTS } from './effects';
import { BONUSES } from './bonuses';

export const SIMPLE_ATTRIBUTE_BUFF: Buff = {
  name: 'Simple Attribute Buff',
  targetType: TargetType.Self,
  duration: {
    duration: 2500,
    type: 'Temporary',
  },
  effect: BONUSES.EnhanceStrength,
  chanceToApply: 1,
};

export const SIMPLE_ATTACK_BUFF: Buff = {
  name: 'Simple Attack Buff',
  targetType: TargetType.Self,
  duration: {
    duration: 1000,
    type: 'Temporary',
  },
  effect: BONUSES.EnhanceStrength,
  chanceToApply: 1,
};

export const SIMPLE_HEALTH_BUFF: Buff = {
  name: 'Simple Health Buff',
  targetType: TargetType.Self,
  duration: {
    duration: 5000,
    type: 'Temporary',
  },
  effect: BONUSES.EnhanceHealth,
  chanceToApply: 1,
};

export const SIMPLE_FURRY_BUFF: Buff = {
  name: 'Simple Furry Buff',
  targetType: TargetType.Self,
  duration: {
    duration: 3000,
    type: 'Temporary',
  },
  effect: EFFECTS.Furry,
  chanceToApply: 1,
};

export const SIMPLE_STUN_BUFF: Buff = {
  name: 'Simple Stun Buff',
  targetType: TargetType.Self,
  duration: {
    duration: 1000,
    type: 'Temporary',
  },
  effect: EFFECTS.Stun,
  chanceToApply: 0.8,
};

export const SIMPLE_FURRY_MAGIC: Buff = {
  name: 'Simple Furry Magic',
  targetType: TargetType.Enemy,
  duration: {
    duration: 2500,
    type: 'Temporary',
  },
  effect: EFFECTS.Furry,
  chanceToApply: 0.6,
};

export const SIMPLE_ATTACK_DEBUFF: Buff = {
  name: 'Simple Attack Debuff',
  targetType: TargetType.Enemy,
  duration: {
    duration: 2500,
    type: 'Temporary',
  },
  effect: BONUSES.DehanceAttack,
  chanceToApply: 1,
};

export const BUFFS: Record<string, Buff> = {
  SimpleAttributeBuff: SIMPLE_ATTRIBUTE_BUFF,
  SimpleAttackBuff: SIMPLE_ATTACK_BUFF,
  SimpleHealthBuff: SIMPLE_HEALTH_BUFF,
  SimpleFurryBuff: SIMPLE_FURRY_BUFF,
  SimpleStunBuff: SIMPLE_STUN_BUFF,
  SimpleFurryMagic: SIMPLE_FURRY_MAGIC,
  SimpleAttackDebuff: SIMPLE_ATTACK_DEBUFF,
};

export function getBuff(name: string): Buff | undefined {
  return BUFFS[name];
}
