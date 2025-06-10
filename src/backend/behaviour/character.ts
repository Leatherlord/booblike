import { Entity, Grid, Size, Speed, World } from '../../common/interfaces';
import { Attack, StraightAttack } from './attacks';
import { Buff } from './buffs';
import { CharClass, getCharacteristicsFromClass, PlayerClass } from './classes';
import { states } from './state';
import { MovementResult, Strategy } from './strategy';

export type Characteristics = {
  s: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  p: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  e: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  a: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
  i: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
};

export function attackStrength(
  attack: Attack,
  char: Character,
  enemy: Character
) {
  const base =
    Math.random() * (attack.maxDamage - attack.minDamage) + attack.minDamage;
  const damage =
    base * (1 + 0.25 * char.characteristics.s) * (1 + 0.05 * char.level);
  const actualDamage = damage * (1 - 0.1 * enemy.characteristics.e);
  return actualDamage;
}

export function health(char: Character) {
  const HP =
    10 +
    (0.25 * char.characteristics.s + 0.5 * char.characteristics.e) * char.level;
  return HP;
}

export function regen(char: Character) {
  const regen = 0.05 * (char.characteristics.e + char.level);
  return regen;
}

export function FOV(char: Character) {
  const areaUp = 4 + Math.floor(0.5 * char.characteristics.p);
  const areaDown = Math.floor(0.5 * char.characteristics.p);
  const areaLeft = 2 + Math.floor(0.5 * char.characteristics.p);
  const areaRight = 2 + Math.floor(0.5 * char.characteristics.p);
  return {
    areaUp: areaUp,
    areaDown: areaDown,
    areaLeft: areaLeft,
    areaRight: areaRight,
  };
}

export function score(char: Character, enemy: Character) {
  const score = char.characteristics.i * 0.25 + enemy.level;
  return score;
}

export function speed(char: Character) {
  switch (char.characteristics.a) {
    case 1:
    case 2:
      return Speed.SUPERSLOW;
    case 3:
    case 4:
      return Speed.SLOW;
    case 5:
    case 6:
      return Speed.NORMAL;
    case 7:
    case 8:
      return Speed.FAST;
    default:
      return Speed.SUPERFAST;
  }
}

export function calculateAttackProbabilities(
  attacker: Characteristics,
  enemy: Characteristics,
  normalize = true
) {
  const { p: P, a: A, e: E } = attacker;
  const { p: Pe, a: Ae } = enemy;

  let phi_miss = Ae / (Ae + P);
  let phi_redirected = Pe / (Pe + A);
  let phi_selfHit = 1 / (1 + A + E);

  let total = phi_miss + phi_redirected + phi_selfHit;

  if (normalize && total > 1) {
    const scale = 0.99 / total;
    phi_miss *= scale;
    phi_redirected *= scale;
    phi_selfHit *= scale;
    total = phi_miss + phi_redirected + phi_selfHit;
  }

  const phi_normal = Math.max(0, 1 - total);

  return {
    phi_miss: phi_miss,
    phi_redirected: phi_redirected,
    phi_self_hit: phi_selfHit,
    phi_normal: phi_normal,
  };
}

export function AttackOutcome(char: Character, enemy: Character) {
  const { phi_miss, phi_redirected, phi_self_hit, phi_normal } =
    calculateAttackProbabilities(char.characteristics, enemy.characteristics);
  const rand = Math.random();
  const thresholds = [
    { threshold: phi_miss, outcome: 'miss' },
    { threshold: phi_miss + phi_redirected, outcome: 'redirected' },
    {
      threshold: phi_miss + phi_redirected + phi_self_hit,
      outcome: 'self-hit',
    },
    { threshold: 1, outcome: 'normal' },
  ];

  for (const { threshold, outcome } of thresholds) {
    if (rand < threshold) return outcome;
  }

  return 'normal';
}

interface AttackResult {
  finalTarget: Entity;
  finalAttack: Attack;
  finalDamage: number;
  status: 'normal' | 'redirected' | 'self-hit' | 'miss';
}

function cloneCharacter(copy: Character, char: Character) {
  copy.name = char.name;
  copy.surname = char.surname;
  copy.strategy = char.strategy;
  copy.healthBar = char.maxHealthBar;
  copy.maxHealthBar = char.maxHealthBar;
  copy.charClass = char.charClass;
  copy.activeBuffs = char.activeBuffs;
  copy.attacks = char.attacks;
  copy.characterSize = char.characterSize;
  copy.areaSize = char.areaSize;
  copy.level = char.level;
  copy.characteristics = char.characteristics;
  copy.speed = char.speed;
  return copy;
}

function getDamage(char: Entity, enemy: Entity, attack: Attack): AttackResult {
  const attackOutcome = AttackOutcome(char.character, enemy.character);
  let damage: number = 0;
  let finalTarget: Entity = enemy;
  switch (attackOutcome) {
    case 'miss': {
      damage = 0;
      break;
    }
    case 'redirected': {
      damage = attackStrength(attack, enemy.character, char.character);
      char.character.healthBar -= damage; // TODO: CHECK FOR DEATH
      finalTarget = char;
      break;
    }
    case 'self-hit': {
      damage = attackStrength(attack, char.character, char.character);
      char.character.healthBar -= damage; // TODO: CHECK FOR DEATH
      finalTarget = char;
      break;
    }
    case 'normal': {
      damage = attackStrength(attack, char.character, enemy.character);
      enemy.character.healthBar -= damage;
      break;
    }
  }
  console.log(
    attackOutcome,
    enemy.character.healthBar,
    char.character.healthBar,
    char.character.maxHealthBar,
    damage
  );
  return {
    finalTarget: finalTarget,
    finalAttack: attack,
    finalDamage: damage,
    status: attackOutcome as 'normal' | 'redirected' | 'self-hit' | 'miss',
  };
}

export interface Character {
  name: string;
  surname?: string;

  strategy: Strategy;
  healthBar: number;
  maxHealthBar: number;
  activeBuffs: Buff[];

  charClass: CharClass;
  attacks: Attack[];
  characterSize: Size;
  areaSize: Grid;
  level: number;
  characteristics: Characteristics;
  score?: number;
  speed: Speed;

  clone: () => Character;
  move: (context: Entity, world: World) => MovementResult;
  damage: (context: Entity, enemy: Entity, attack: Attack) => AttackResult;
  update: () => void; // runs in loop
  getSpeed: () => Speed;
  getAttackSpeed: (attack: Attack) => Speed;
}

export class PlayerCharacter implements Character {
  constructor(name: string, characteristics: Characteristics) {
    this.charClass = PlayerClass;
    this.strategy = this.charClass.strategy[states.Normal as states];
    this.activeBuffs = [];
    this.attacks = [StraightAttack];
    this.characterSize = { width: 1, height: 1 };
    this.level = 1;
    this.score = 0;

    this.characteristics = characteristics;
    this.name = name;

    this.maxHealthBar = health(this);
    this.healthBar = this.maxHealthBar;
    this.areaSize = FOV(this);
    this.speed = speed(this);
  }

  name: string;
  strategy: Strategy;
  healthBar: number;
  maxHealthBar: number;
  activeBuffs: Buff[];
  charClass: CharClass;
  attacks: Attack[];
  characterSize: Size;
  areaSize: Grid;

  level: number;
  characteristics: Characteristics;
  score?: number;
  speed: Speed;

  public clone(): Character {
    const character = new PlayerCharacter(this.name, this.characteristics);
    return cloneCharacter(character, this);
  }
  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = this.strategy.move(context, world);
    return result;
  }
  public damage(context: Entity, enemy: Entity, attack: Attack): AttackResult {
    return getDamage(context, enemy, attack);
  }
  public update(): void {
    throw 'Cannot update yet';
  }

  public getSpeed(): Speed {
    return this.speed;
  }

  public getAttackSpeed(attack: Attack): Speed {
    return attack.speed * 5;
  }
}

export class RandomEnemyCharacter implements Character {
  constructor(charClass: CharClass) {
    this.charClass = charClass;
    const { name, surname, characteristics, attacks, strategy } =
      getCharacteristicsFromClass(charClass);

    this.name = name;
    this.surname = surname;
    this.characteristics = characteristics as Characteristics;
    this.attacks = attacks;
    this.strategy = strategy;

    this.activeBuffs = [];
    this.characterSize = { width: 1, height: 1 };

    //this.level = Math.max(1, player.level + (Math.random() < 0.5 ? -1 : 1)); // align to player kinda | maybe difficulty later
    this.level = 1;

    this.maxHealthBar = health(this);
    this.healthBar = this.maxHealthBar;
    this.areaSize = FOV(this);
    this.speed = speed(this);
  }
  name: string;
  surname: string;
  strategy: Strategy;
  healthBar: number;
  maxHealthBar: number;
  activeBuffs: Buff[];
  charClass: CharClass;
  attacks: Attack[];
  characterSize: Size;
  areaSize: Grid;

  level: number;
  characteristics: Characteristics;
  speed: Speed;

  public clone(): Character {
    const character = new RandomEnemyCharacter(this.charClass);
    return cloneCharacter(character, this);
  }
  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = this.strategy.move(context, world);
    return result;
  }
  public damage(context: Entity, enemy: Entity, attack: Attack): AttackResult {
    return getDamage(context, enemy, attack);
  }
  public update(): void {
    throw 'Cannot update yet';
  }

  public getSpeed(): Speed {
    return this.speed;
  }

  public getAttackSpeed(attack: Attack): Speed {
    return attack.speed * 5;
  }
}
