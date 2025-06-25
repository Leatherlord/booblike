import { PriorityQueue } from 'typescript-collections';
import { Entity, Grid, Size, Speed, World } from '../../common/interfaces';
import { Attack, StraightAttack } from './attacks';
import { Buff, isEffect } from './buffs';
import {
  AttackResult,
  BuffAddOns,
  BuffDuration,
  Character,
  Characteristics,
} from './character';
import { CharClass } from './classes';
import { states } from './state';
import { MovementResult, Strategy, strategyMap } from './strategy';
import { reconstructCharacter } from '../serializer';

export function chooseDecorator(character: Character, buff: Buff) {
  if (!isEffect(buff.effect)) return;
  switch (buff.effect.applyEffect) {
    case 'furyEffect': {
      return new FuryCharacter(character, buff);
    }
    case 'furryEffect': {
      return new FurryCharacter(character, buff);
    }
    case 'pacifyEffect': {
      return new PacifiedCharacter(character, buff);
    }
    case 'stunEffect': {
      return new StunnedCharacter(character, buff);
    }
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

export class Decorator implements Character {
  constructor(character: Character, buff: Buff) {
    shallow_clone_all(this, character);
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

  public serialize(): any {
    return {
      _isDecorator: true,
      _decoratorType: this.constructor.name,
      _decoratorStartTime: this.startTime,
      _decoratorTimer: this.timer,
      _decoratorCausedBy: this.causedBy,
      _inheritedCharacter: this.inheritedCharacter.serialize(),
      name: this.name,
      surname: this.surname,
      texture: this.texture,
      healthBar: this.healthBar,
      baseMaxHealthBar: this.baseMaxHealthBar,
      maxHealthBar: this.maxHealthBar,
      characterSize: this.characterSize,
      areaSize: this.areaSize,
      level: this.level,
      baseCharacteristics: this.baseCharacteristics,
      characteristics: this.characteristics,
      score: this.score,
      speed: this.speed,
      state: this.state,
      strategy: undefined,
      attacks: undefined,
      buffsBonus: undefined,
      allBuffs: undefined,
      inheritedCharacter: undefined,
      childCharacter: undefined,
      move: undefined,
      damage: undefined,
      update: undefined,
      getSpeed: undefined,
      getAttackSpeed: undefined,
      setState: undefined,
      applyBuff: undefined,
      onDeath: undefined,
      getTexture: undefined,
      getBuffs: undefined,
      serialize: undefined,
    };
  }

  static deserialize(data: any): Decorator {
    const inheritedChar = reconstructCharacter(data._inheritedCharacter);

    let decorator: Decorator;
    switch (data._decoratorType) {
      case 'FuryCharacter':
        decorator = new FuryCharacter(inheritedChar, data._decoratorCausedBy);
        break;
      case 'FurryCharacter':
        decorator = new FurryCharacter(inheritedChar, data._decoratorCausedBy);
        break;
      case 'PacifiedCharacter':
        decorator = new PacifiedCharacter(
          inheritedChar,
          data._decoratorCausedBy
        );
        break;
      case 'StunnedCharacter':
        decorator = new StunnedCharacter(
          inheritedChar,
          data._decoratorCausedBy
        );
        break;
      default:
        console.warn(`Unknown decorator type: ${data._decoratorType}`);
        decorator = new Decorator(inheritedChar, data._decoratorCausedBy);
        break;
    }

    decorator.startTime = data._decoratorStartTime;
    decorator.timer = data._decoratorTimer;

    if (data.texture !== undefined) decorator.texture = data.texture;
    if (data.state !== undefined) decorator.state = data.state;
    if (data.healthBar !== undefined) decorator.healthBar = data.healthBar;
    if (data.maxHealthBar !== undefined)
      decorator.maxHealthBar = data.maxHealthBar;
    if (data.characteristics !== undefined)
      decorator.characteristics = data.characteristics;

    return decorator;
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

  public serialize(): any {
    const baseData = super.serialize();
    return {
      ...baseData,
      _decoratorType: 'PacifiedCharacter',
      state: this.state,
    };
  }
}

export class FurryCharacter extends Decorator {
  constructor(character: Character, buff: Buff) {
    super(character, buff);
    this.texture = 'furry';
  }

  public getTexture(): string {
    if (this.texture) return this.texture;
    return '';
  }

  public serialize(): any {
    const baseData = super.serialize();
    return {
      ...baseData,
      _decoratorType: 'FurryCharacter',
      texture: this.texture,
    };
  }
}

export class FuryCharacter extends Decorator {
  constructor(character: Character, buff: Buff) {
    super(character, buff);
    this.strategy = strategyMap['Fury'];
  }

  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = this.strategy.move(context, world);
    return result;
  }

  public serialize(): any {
    const baseData = super.serialize();
    return {
      ...baseData,
      _decoratorType: 'FuryCharacter',
      _strategyName: 'Fury',
    };
  }
}

export class StunnedCharacter extends Decorator {
  constructor(character: Character, buff: Buff) {
    super(character, buff);
    this.strategy = this.charClass.strategy[this.state as states];
  }

  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = {
      to: from,
      lookDir: lookDir,
      lastAttacked: animation.lastAttacked,
      lastMoved: animation.lastMoved,
    };
    return result;
  }

  public serialize(): any {
    const baseData = super.serialize();
    return {
      ...baseData,
      _decoratorType: 'StunnedCharacter',
    };
  }
}
