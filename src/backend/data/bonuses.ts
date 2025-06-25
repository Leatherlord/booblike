import { Bonus, StatType, ModifierType } from '../behaviour/buffs';

export const ENHANCE_STRENGTH: Bonus = {
  name: 'Enhance Strength',
  statType: StatType.Attribute,
  attributeType: 's',
  modifierType: ModifierType.Flat,
  value: 4,
};

export const ENHANCE_HEALTH: Bonus = {
  name: 'Enhance Health',
  statType: StatType.Health,
  modifierType: ModifierType.Mult,
  value: 10,
};

export const ENHANCE_ATTACK: Bonus = {
  name: 'Enhance Attack',
  statType: StatType.Attack,
  modifierType: ModifierType.Mult,
  value: 2,
};

export const DEHANCE_ATTACK: Bonus = {
  name: 'Enhance Attack',
  statType: StatType.Attack,
  modifierType: ModifierType.Mult,
  value: 0.1,
};

export const BONUSES: Record<string, Bonus> = {
  EnhanceStrength: ENHANCE_STRENGTH,
  EnhanceHealth: ENHANCE_HEALTH,
  EnhanceAttack: ENHANCE_ATTACK,
  DehanceAttack: DEHANCE_ATTACK,
};

export function getBonus(name: string): Bonus | undefined {
  return BONUSES[name];
}
