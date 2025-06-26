import { PriorityQueue } from 'typescript-collections';
import {
  Entity,
  Grid,
  Size,
  Speed,
  World,
  InventoryItem,
} from '../../common/interfaces';
import { Attack } from './attacks';
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
    case 'burnEffect': {
      return new BurningCharacter(character, buff);
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
  protected character: Character;
  public inheritedCharacter: Character;
  public startTime: number;
  public timer: number;
  public causedBy: Buff;

  constructor(character: Character, buff: Buff) {
    this.character = character;
    this.inheritedCharacter = character;
    this.startTime = Date.now();
    this.timer = buff.duration.duration;
    this.causedBy = buff;
  }

  public get allBuffs(): PriorityQueue<BuffDuration> {
    return this.character.allBuffs;
  }
  public set allBuffs(value: PriorityQueue<BuffDuration>) {
    this.character.allBuffs = value;
  }

  public get childCharacter(): Character | undefined {
    return this.character.childCharacter;
  }
  public set childCharacter(value: Character | undefined) {
    this.character.childCharacter = value;
  }

  public get name(): string {
    return this.character.name;
  }
  public set name(value: string) {
    this.character.name = value;
  }

  public get surname(): string | undefined {
    return this.character.surname;
  }
  public set surname(value: string | undefined) {
    this.character.surname = value;
  }

  public get texture(): string | undefined {
    return this.character.texture;
  }
  public set texture(value: string | undefined) {
    this.character.texture = value;
  }

  public get strategy(): Strategy {
    return this.character.strategy;
  }
  public set strategy(value: Strategy) {
    this.character.strategy = value;
  }

  public get healthBar(): number {
    return this.character.healthBar;
  }
  public set healthBar(value: number) {
    this.character.healthBar = value;
  }

  public get baseMaxHealthBar(): number {
    return this.character.baseMaxHealthBar;
  }
  public set baseMaxHealthBar(value: number) {
    this.character.baseMaxHealthBar = value;
  }

  public get maxHealthBar(): number {
    return this.character.maxHealthBar;
  }
  public set maxHealthBar(value: number) {
    this.character.maxHealthBar = value;
  }

  public get charClass(): CharClass {
    return this.character.charClass;
  }
  public set charClass(value: CharClass) {
    this.character.charClass = value;
  }

  public get attacks(): Attack[] {
    return this.character.attacks;
  }
  public set attacks(value: Attack[]) {
    this.character.attacks = value;
  }

  public get characterSize(): Size {
    return this.character.characterSize;
  }
  public set characterSize(value: Size) {
    this.character.characterSize = value;
  }

  public get areaSize(): Grid {
    return this.character.areaSize;
  }
  public set areaSize(value: Grid) {
    this.character.areaSize = value;
  }

  public get level(): number {
    return this.character.level;
  }
  public set level(value: number) {
    this.character.level = value;
  }

  public get baseCharacteristics(): Characteristics {
    return this.character.baseCharacteristics;
  }
  public set baseCharacteristics(value: Characteristics) {
    this.character.baseCharacteristics = value;
  }

  public get characteristics(): Characteristics {
    return this.character.characteristics;
  }
  public set characteristics(value: Characteristics) {
    this.character.characteristics = value;
  }

  public get score(): number | undefined {
    return this.character.score;
  }
  public set score(value: number | undefined) {
    this.character.score = value;
  }

  public get speed(): Speed {
    return this.character.speed;
  }
  public set speed(value: Speed) {
    this.character.speed = value;
  }

  public get state(): states {
    return this.character.state;
  }
  public set state(value: states) {
    this.character.state = value;
  }

  public get buffsBonus(): BuffAddOns {
    return this.character.buffsBonus;
  }
  public set buffsBonus(value: BuffAddOns) {
    this.character.buffsBonus = value;
  }

  public move(context: Entity, world: World): MovementResult {
    return this.character.move(context, world);
  }

  public damage(context: Entity, enemy: Entity, attack: Attack): AttackResult {
    return this.character.damage(context, enemy, attack);
  }

  public update(context: Entity, world: World): void {
    if (this.startTime + this.timer <= Date.now()) {
      if (this.character.childCharacter) {
        context.character = this.character.childCharacter;
        this.character.childCharacter.inheritedCharacter = this.character;
      } else {
        context.character = this.character;
      }
    }
    this.character.update(context, world);
  }

  public getSpeed(): Speed {
    return this.character.getSpeed();
  }

  public getAttackSpeed(attack: Attack): Speed {
    return this.character.getAttackSpeed(attack);
  }

  public setState(state: states): void {
    this.character.setState(state);
  }

  public applyBuff(context: Entity, buffs: Buff[]): void {
    this.character.applyBuff(context, buffs);
  }

  public onDeath(context: Entity, world: World): void {
    this.character.onDeath(context, world);
  }

  public getTexture(): string {
    return this.character.getTexture();
  }

  public getBuffs(): PriorityQueue<BuffDuration> {
    return this.character.getBuffs();
  }

  public equipWeapon(weapon: InventoryItem | undefined): void {
    this.character.equipWeapon(weapon);
  }

  public serialize(): any {
    return {
      ...this.character.serialize(),
      _decoratorType: this.constructor.name,
      _decoratorStartTime: this.startTime,
      _decoratorTimer: this.timer,
      _decoratorCausedBy: this.causedBy,
      _inheritedCharacter: this.character.serialize(),
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
    decorator.causedBy = data._decoratorCausedBy;

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
  private overrideState: states = states.Pacifist;
  private overrideStrategy: Strategy;

  constructor(character: Character, buff: Buff) {
    super(character, buff);
    this.overrideStrategy = this.charClass.strategy[this.overrideState];
  }

  public get state(): states {
    return this.overrideState;
  }

  public set state(value: states) {
    this.overrideState = value;
  }

  public get strategy(): Strategy {
    return this.overrideStrategy;
  }

  public set strategy(value: Strategy) {
    this.overrideStrategy = value;
  }

  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = this.overrideStrategy.move(context, world);
    return result;
  }

  public setState(state: states): void {
    this.overrideState = state;
    this.overrideStrategy = this.charClass.strategy[state];
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
  private overrideTexture = 'furry';

  constructor(character: Character, buff: Buff) {
    super(character, buff);
  }

  public get texture(): string | undefined {
    return this.overrideTexture;
  }

  public set texture(value: string | undefined) {
    this.overrideTexture = value || 'furry';
  }

  public getTexture(): string {
    return this.overrideTexture;
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
  private overrideStrategy: Strategy = strategyMap['Fury'];

  constructor(character: Character, buff: Buff) {
    super(character, buff);
  }

  public get strategy(): Strategy {
    return this.overrideStrategy;
  }

  public set strategy(value: Strategy) {
    this.overrideStrategy = value;
  }

  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = this.overrideStrategy.move(context, world);
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

export class BurningCharacter extends Decorator {
  private overrideStrategy: Strategy = strategyMap['Coward'];

  constructor(character: Character, buff: Buff) {
    super(character, buff);
  }

  public get strategy(): Strategy {
    return this.overrideStrategy;
  }

  public set strategy(value: Strategy) {
    this.overrideStrategy = value;
  }

  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = this.overrideStrategy.move(context, world);
    return result;
  }

  public update(context: Entity, world: World): void {
    if (Date.now() % 1000 < 100) {
      context.character.healthBar -= 10;

      if (world.onCreateFloatingText) {
        world.onCreateFloatingText(
          context.x,
          context.y,
          'BURN!',
          'debuff',
          '#ff6600'
        );
      }
    }

    super.update(context, world);
  }
}

export function reconstructDecorator(data: any): Character {
  const inheritedChar = reconstructCharacter(data._inheritedCharacter);
  let decorator: Decorator;

  switch (data._decoratorType) {
    case 'PacifiedCharacter':
      decorator = new PacifiedCharacter(inheritedChar, data._decoratorCausedBy);
      break;
    case 'FurryCharacter':
      decorator = new FurryCharacter(inheritedChar, data._decoratorCausedBy);
      break;
    case 'FuryCharacter':
      decorator = new FuryCharacter(inheritedChar, data._decoratorCausedBy);
      break;
    case 'StunnedCharacter':
      decorator = new StunnedCharacter(inheritedChar, data._decoratorCausedBy);
      break;
    default:
      console.warn(`Unknown decorator type: ${data._decoratorType}`);
      decorator = new Decorator(inheritedChar, data._decoratorCausedBy);
      break;
  }

  decorator.startTime = data._decoratorStartTime;
  decorator.timer = data._decoratorTimer;
  decorator.causedBy = data._decoratorCausedBy;

  return decorator;
}
