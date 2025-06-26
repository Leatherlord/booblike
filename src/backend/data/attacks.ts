import { Speed, generateGrid } from '../../common/interfaces';
import { Attack } from '../behaviour/attacks';
import { BUFFS } from './buffs';

export const STRAIGHT_ATTACK: Attack = {
  name: 'StraightAttack',
  speed: Speed.SUPERFAST,
  minDamage: 5,
  maxDamage: 10,
  attackBuffs: [BUFFS.SimpleFurryMagic],
  areaSize: {
    areaUp: 1,
    areaDown: 1,
    areaRight: 1,
    areaLeft: 1,
  },
  area: generateGrid([
    [0, 0, 0],
    [0, 0, 0],
    [0, 1, 0],
  ]),
};

export const CIRCLE_ATTACK: Attack = {
  name: 'CircleAttack',
  speed: Speed.NORMAL,
  minDamage: 10,
  maxDamage: 15,
  attackBuffs: [BUFFS.SimpleFurryMagic],
  areaSize: {
    areaUp: 1,
    areaDown: 1,
    areaRight: 1,
    areaLeft: 1,
  },
  area: generateGrid([
    [1, 1, 1],
    [1, 0, 1],
    [1, 1, 1],
  ]),
};

export const ATTACK_FORWARD: Attack = {
  name: 'AttackForward',
  speed: Speed.SLOW,
  minDamage: 10,
  maxDamage: 15,
  attackBuffs: [BUFFS.SimpleAttackDebuff],
  areaSize: {
    areaUp: 0,
    areaDown: 3,
    areaRight: 1,
    areaLeft: 1,
  },
  area: generateGrid([
    [1, 0, 1],
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1],
  ]),
};

export const ATTACKS: Record<string, Attack> = {
  StraightAttack: STRAIGHT_ATTACK,
  CircleAttack: CIRCLE_ATTACK,
  AttackForward: ATTACK_FORWARD,
};

export function getAttack(name: string): Attack | undefined {
  return ATTACKS[name];
}
