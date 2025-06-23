import { PriorityQueue } from 'typescript-collections';
import { Entity, Grid, Size, Speed, World } from '../../common/interfaces';
import { Attack, StraightAttack } from '../behaviour/attacks';
import { Buff, isEffect } from '../behaviour/buffs';
import {
  AttackResult,
  BuffAddOns,
  BuffDuration,
  Character,
  Characteristics,
} from '../behaviour/character';
import { CharClass } from '../behaviour/classes';
import { states } from '../behaviour/state';
import { MovementResult, Strategy } from '../behaviour/strategy';

export function chooseDecorator(character: Character, buff: Buff) {
  if (!isEffect(buff.effect)) return;
  switch (buff.effect.applyEffect) {
    // case "furyEffect" : {
    //   return;
    // }
    case 'furryEffect': {
      return new FurryCharacter(character, buff);
    }
    case 'pacifyEffect': {
      return new PacifiedCharacter(character, buff);
    }
    // case "stunEffect" : {
    //   return;
    // }
  }
  console.error(
    "chooseDecorator cound't choose decorator for",
    buff.effect.applyEffect
  );
}

function shallow_clone_all<T extends Character>(char1: T, char2: T): void {
  (Object.keys(char2) as Array<keyof T>).forEach((key) => {
    char1[key] = char2[key];
  });
}

function shallow_clone_Character(char1: Character, char2: Character): void {
  char1.name = char2.name;
  char1.surname = char2.surname;
  char1.strategy = char2.strategy;
  char1.healthBar = char2.healthBar;
  char1.baseMaxHealthBar = char2.baseMaxHealthBar;
  char1.maxHealthBar = char2.maxHealthBar;
  char1.charClass = char2.charClass;
  char1.attacks = char2.attacks; // Shallow copy
  char1.characterSize = char2.characterSize;
  char1.areaSize = char2.areaSize;
  char1.level = char2.level;
  char1.baseCharacteristics = char2.baseCharacteristics; // Shallow copy
  char1.characteristics = char2.characteristics; // Shallow copy
  char1.score = char2.score;
  char1.speed = char2.speed;
  char1.state = char2.state;
  char1.buffsBonus = char2.buffsBonus; // Shallow copy
  char1.texture = char2.texture;
  char1.allBuffs = char2.allBuffs;
}

export class Decorator implements Character {
  constructor(character: Character, buff: Buff) {
    shallow_clone_Character(this, character);
    this.inheritedCharacter = character;
    this.timer = buff.duration.duration;
    this.startTime = Date.now();
    this.timer = buff.duration.duration;
    this.causedBy = buff;
  }
  allBuffs!: PriorityQueue<BuffDuration>;
  inheritedCharacter: Character;
  childCharacter?: Character;
  name!: string;
  surname?: string | undefined;
  strategy!: Strategy;
  healthBar!: number;
  baseMaxHealthBar!: number;
  maxHealthBar!: number;
  charClass!: CharClass;
  attacks!: Attack[];
  characterSize!: Size;
  areaSize!: Grid;
  level!: number;
  baseCharacteristics!: Characteristics;
  characteristics!: Characteristics;
  score?: number | undefined;
  speed!: Speed;
  state!: states;
  buffsBonus!: BuffAddOns;
  texture?: string;

  startTime: number;
  timer: number;

  causedBy: Buff;

  public move(context: Entity, world: World): MovementResult {
    return this.inheritedCharacter.move(context, world);
  }
  public damage(context: Entity, enemy: Entity, attack: Attack): AttackResult {
    return this.inheritedCharacter.damage(context, enemy, attack);
  }
  public update(context: Entity, world: World): void {
    if (this.startTime + this.timer <= Date.now()) {
      console.log('removing effect');
      this.inheritedCharacter.childCharacter = this.childCharacter;
      if (this.childCharacter) {
        this.childCharacter.inheritedCharacter = this.inheritedCharacter;
      } else {
        context.character = this.inheritedCharacter;
      }
    }
    this.inheritedCharacter.update(context, world);
  }
  public getSpeed(): Speed {
    return this.inheritedCharacter.getSpeed();
  }
  public getAttackSpeed(attack: Attack): Speed {
    return this.inheritedCharacter.getAttackSpeed(attack);
  }
  public setState(state: states): void {
    this.inheritedCharacter.setState(state);
  }
  public applyBuff(context: Entity, buffs: Buff[]): void {
    this.inheritedCharacter.applyBuff(context, buffs);
  }
  public onDeath(context: Entity, world: World): void {
    this.inheritedCharacter.onDeath(context, world);
  }
  public getTexture(): string {
    return this.inheritedCharacter.getTexture();
  }
  public getBuffs(): PriorityQueue<BuffDuration> {
    return this.inheritedCharacter.getBuffs();
  }
}

export class PacifiedCharacter extends Decorator {
  constructor(character: Character, buff: Buff) {
    super(character, buff);
    this.state = states.Pacifist;
    this.strategy = this.charClass.strategy[this.state as states];
  }

  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = this.strategy.move(context, world);
    return result;
  }
  public setState(state: states): void {
    this.state = state;
  }
}

export class FurryCharacter extends Decorator {
  constructor(character: Character, buff: Buff) {
    super(character, buff);
    this.texture = 'furry';
    console.log('applied furry on', character.name);
  }
  public getTexture(): string {
    if (this.texture) return this.texture;
    return '';
  }
}

export class StunnedCharacter extends Decorator {
  constructor(character: Character, buff: Buff) {
    super(character, buff);
    this.strategy = this.charClass.strategy[this.state as states];
  }
  public getTexture(): string {
    if (this.texture) return this.texture;
    return '';
  }
}
