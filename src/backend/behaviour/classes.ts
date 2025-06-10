import * as Attacks from './attacks';
import { Characteristics } from './character';
import { states } from './state';
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

  return {
    name: name,
    surname: surname,
    characteristics: characteristicsBounds,
    attacks: attacks,
    strategy: strategy,
  };
}

export interface CharClass {
  className: string;
  possibleNames: string[];
  possibleSurnames: string[];
  characteristicsBounds: [Characteristics, Characteristics];
  availableAttacks: Attacks.Attack[];
  numberOfAttacks: number;
  strategy: Record<states, Strategy>;
}

export let PlayerClass: CharClass = {
  className: 'player class',
  possibleNames: ['Player'],
  possibleSurnames: ['Player'],
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
};
export let StrongClass: CharClass = {
  className: 'stringClass',
  possibleNames: ['Beaver', 'Daniil', 'Caveman', 'Kevin'],
  possibleSurnames: [
    'The Fearsome',
    'The Sinful',
    'The Homosexual',
    'The Defiler',
  ],
  characteristicsBounds: [
    { s: 6, p: 6, e: 6, i: 6, a: 6 },
    { s: 10, p: 5, e: 5, i: 5, a: 5 },
  ],
  availableAttacks: [Attacks.StraightAttack, Attacks.CircleAttack],
  numberOfAttacks: 3,
  strategy: {
    [states.Pacifist]: new Neutral(),
    [states.Normal]: new Aggresive(),
    [states.Panic]: new Coward(),
    [states.Angry]: new Aggresive(),
  },
};
