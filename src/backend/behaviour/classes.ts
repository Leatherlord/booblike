import * as Attacks from './attacks';
import { Characteristics } from './character';
import { states, EventType } from './state';
import {
  Aggresive,
  Coward,
  Fury,
  Neutral,
  PlayerStrategy,
  Strategy,
} from './strategy';

export function getCharacteristicsFromClass(class_: CharClass) {
  const name =
    class_.possibleNames[
      Math.floor(Math.random() * class_.possibleNames.length)
    ];

  const surname =
    class_.possibleSurnames[
      Math.floor(Math.random() * class_.possibleSurnames.length)
    ];

  const [min, max] = class_.characteristicsBounds;
  const randomBetween = (minVal: number, maxVal: number) =>
    Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
  const characteristicsBounds = {
    s: randomBetween(min.s, max.s),
    p: randomBetween(min.p, max.p),
    e: randomBetween(min.e, max.e),
    i: randomBetween(min.i, max.i),
    a: randomBetween(min.a, max.a),
  };

  const availableAttacks = class_.availableAttacks;
  const indexOfAttacks: number[] = Array.from(
    Array(class_.numberOfAttacks).keys()
  );
  for (let i = indexOfAttacks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indexOfAttacks[i], indexOfAttacks[j]] = [
      indexOfAttacks[j],
      indexOfAttacks[i],
    ];
  }
  const attacks = indexOfAttacks.map((index) => availableAttacks[index]);

  const strategy = class_.strategy[states.Normal as states];

  let texture: string = '';
  if (class_.possibleTextures && class_.possibleTextures.length > 0) {
    texture =
      class_.possibleTextures[
        Math.floor(Math.random() * class_.possibleTextures.length)
      ];
  }

  let ans: any = {
    name: name,
    surname: surname,
    characteristics: characteristicsBounds,
    attacks: attacks,
    strategy: strategy,
  };
  if (texture != '') {
    ans.texture = texture;
  }
  return ans;
}

export interface CharClass {
  className: string;
  possibleNames: string[];
  possibleSurnames: string[];
  possibleTextures?: string[];
  characteristicsBounds: [Characteristics, Characteristics];
  availableAttacks: Attacks.Attack[];
  numberOfAttacks: number;
  strategy: Record<states, Strategy>;
  transitions: Record<states, Partial<Record<EventType, states>>>;
}

export let PlayerClass: CharClass = {
  className: 'player class',
  possibleNames: ['Player'],
  possibleSurnames: ['Player'],
  possibleTextures: ['player'],
  characteristicsBounds: [
    { s: 1, p: 1, e: 1, i: 1, a: 1 },
    { s: 10, p: 10, e: 10, i: 10, a: 10 },
  ],
  availableAttacks: [],
  numberOfAttacks: 9,
  strategy: {
    [states.Pacifist]: new Neutral(),
    [states.Normal]: new PlayerStrategy(),
    [states.Panic]: new Coward(),
    [states.Angry]: new Fury(),
  },
  transitions: {
    [states.Pacifist]: {
      [EventType.Pacify]: states.Normal,
      [EventType.Anger]: states.Normal,
      [EventType.Damage]: states.Normal,
      [EventType.Heal]: states.Normal,
    },
    [states.Normal]: {
      [EventType.Pacify]: states.Normal,
      [EventType.Anger]: states.Normal,
      [EventType.Damage]: states.Normal,
      [EventType.Heal]: states.Normal,
    },
    [states.Angry]: {
      [EventType.Pacify]: states.Normal,
      [EventType.Anger]: states.Normal,
      [EventType.Damage]: states.Normal,
      [EventType.Heal]: states.Normal,
    },
    [states.Panic]: {
      [EventType.Pacify]: states.Normal,
      [EventType.Anger]: states.Normal,
      [EventType.Damage]: states.Normal,
      [EventType.Heal]: states.Normal,
    },
  },
};
