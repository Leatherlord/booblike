import { CharClass } from '../behaviour/classes';
import { strategyMap } from '../behaviour/strategy';
import { states } from '../behaviour/state';
import { ATTACKS } from './attacks';

export const WEAKLING_CLASS: CharClass = {
  className: 'WeaklingClass',
  possibleNames: ['Daniil', 'Vladimir', 'Pavel'],
  possibleSurnames: ['Very Scared', 'Fearful', 'Hates you'],
  possibleTextures: ['coward', 'coward2'],
  characteristicsBounds: [
    {
      s: 1,
      p: 1,
      e: 1,
      i: 1,
      a: 1,
    },
    {
      s: 5,
      p: 5,
      e: 5,
      i: 5,
      a: 5,
    },
  ],
  availableAttacks: [
    ATTACKS.StraightAttack,
    ATTACKS.AttackForward,
    ATTACKS.CircleAttack,
  ],
  numberOfAttacks: 2,
  strategy: {
    [states.Pacifist]: strategyMap.Neutral,
    [states.Normal]: strategyMap.Coward,
    [states.Panic]: strategyMap.Coward,
    [states.Angry]: strategyMap.Coward,
  },
  transitions: {
    Pacifist: { Anger: states.Normal },
    Normal: { Anger: states.Angry, Damage: states.Panic },
    Angry: { Pacify: states.Normal, Damage: states.Panic },
    Panic: { Heal: states.Normal, Anger: states.Angry },
  },
};

export const MIDDLE_CLASS: CharClass = {
  className: 'MiddleClass',
  possibleNames: ['Some Dude', 'Villagerina', 'Valentina'],
  possibleSurnames: ['Smith', 'Mikhailovna', "IDK Kevin's mom or SMTH"],
  possibleTextures: ['enemy'],
  characteristicsBounds: [
    {
      s: 6,
      p: 6,
      e: 6,
      i: 6,
      a: 6,
    },
    {
      s: 10,
      p: 5,
      e: 5,
      i: 5,
      a: 5,
    },
  ],
  availableAttacks: [ATTACKS.StraightAttack, ATTACKS.CircleAttack],
  numberOfAttacks: 1,
  strategy: {
    [states.Pacifist]: strategyMap.Neutral,
    [states.Normal]: strategyMap.Neutral,
    [states.Panic]: strategyMap.Coward,
    [states.Angry]: strategyMap.Aggresive,
  },
  transitions: {
    Pacifist: { Anger: states.Normal },
    Normal: { Anger: states.Angry, Damage: states.Panic },
    Angry: { Pacify: states.Normal, Damage: states.Panic },
    Panic: { Heal: states.Normal, Anger: states.Angry },
  },
};

export const STRONG_CLASS: CharClass = {
  className: 'StrongClass',
  possibleNames: ['Beaver', 'Daniil', 'Caveman', 'Kevin'],
  possibleSurnames: [
    'The Fearsome',
    'The Sinful',
    'The Homosexual',
    'The Defiler',
  ],
  possibleTextures: ['player'],
  characteristicsBounds: [
    {
      s: 6,
      p: 6,
      e: 6,
      i: 6,
      a: 6,
    },
    {
      s: 10,
      p: 5,
      e: 5,
      i: 5,
      a: 5,
    },
  ],
  availableAttacks: [
    ATTACKS.StraightAttack,
    ATTACKS.AttackForward,
    ATTACKS.CircleAttack,
  ],
  numberOfAttacks: 2,
  strategy: {
    [states.Pacifist]: strategyMap.Neutral,
    [states.Normal]: strategyMap.Aggresive,
    [states.Panic]: strategyMap.Coward,
    [states.Angry]: strategyMap.Aggresive,
  },
  transitions: {
    Pacifist: { Anger: states.Normal },
    Normal: { Anger: states.Angry, Damage: states.Panic },
    Angry: { Pacify: states.Normal, Damage: states.Panic },
    Panic: { Heal: states.Normal, Anger: states.Angry },
  },
};

export const CLASSES: Record<string, CharClass> = {
  WeaklingClass: WEAKLING_CLASS,
  MiddleClass: MIDDLE_CLASS,
  StrongClass: STRONG_CLASS,
};

export function getCharClass(name: string): CharClass | undefined {
  return CLASSES[name];
}
