import { Speed, InventoryItem } from '../../common/interfaces';
import { Attack } from '../behaviour/attacks';

export const SWORD_ATTACK: Attack = {
  name: 'Sword Strike',
  speed: Speed.FAST,
  minDamage: 10,
  maxDamage: 15,
  attackBuffs: [],
  areaSize: {
    areaUp: 1,
    areaDown: 3,
    areaRight: 1,
    areaLeft: 1,
  },
  area: {
    UP: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0],
    ],
    DOWN: [
      [0, 1, 0],
      [1, 0, 1],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
    LEFT: [
      [0, 0, 0, 1, 0],
      [1, 1, 1, 0, 1],
      [0, 0, 0, 1, 0],
    ],
    RIGHT: [
      [0, 1, 0, 0, 0],
      [1, 0, 1, 1, 1],
      [0, 1, 0, 0, 0],
    ],
  },
};

export type WeaponData = Omit<InventoryItem, 'type'> & {
  type: 'weapon';
};

export const WEAPONS: Record<string, WeaponData> = {
  sword: {
    id: 'sword',
    name: 'Sword',
    description: 'A basic sword with cone attack pattern',
    type: 'weapon',
    icon: '⚔️',
    characteristicsBonuses: {
      s: 5,
      a: 2,
    },
    attack: SWORD_ATTACK,
  },
};

export function getWeapon(id: string): WeaponData | undefined {
  return WEAPONS[id];
}

export function createWeaponCopy(id: string): WeaponData | undefined {
  const weapon = WEAPONS[id];
  if (!weapon) return undefined;

  return {
    ...weapon,
    attack: weapon.attack ? { ...weapon.attack } : undefined,
  };
}
