import { prngAlea } from "ts-seedrandom";
import { Character, RandomEnemyCharacter } from "./behaviour/character";
import { getCharClassMap } from "./data/dataloader";

export function generateCharacterWithSeed(seed: number): Character {
    const rng = prngAlea(seed);
    const charClassMap = getCharClassMap();
    let classNames = Object.keys(charClassMap);
    const classNum = Math.floor(rng() * classNames.length);
    return new RandomEnemyCharacter(charClassMap[classNum]);
}

export function generateCharacter(): Character {
    const charClassMap = getCharClassMap();
    let classNames = Object.keys(charClassMap);
    console.log(charClassMap)
    const classNum = Math.floor(Math.random() * classNames.length);
    return new RandomEnemyCharacter(charClassMap[classNames[classNum]]);
}