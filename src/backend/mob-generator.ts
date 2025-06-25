import { prngAlea } from 'ts-seedrandom';
import { Character, RandomEnemyCharacter } from './behaviour/character';
import { CLASSES } from './data/classes';

export function generateCharacterWithSeed(seed: number): Character {
  const rng = prngAlea(seed);
  let classNames = Object.keys(CLASSES);
  const classNum = Math.floor(rng() * classNames.length);
  return new RandomEnemyCharacter(CLASSES[classNames[classNum]]);
}

export function generateCharacter(): Character {
  let classNames = Object.keys(CLASSES);
  const classNum = Math.floor(Math.random() * classNames.length);
  return new RandomEnemyCharacter(CLASSES[classNames[classNum]]);
}
