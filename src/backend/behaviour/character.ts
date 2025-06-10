import { Entity, Grid, Size, Speed, World } from '../../common/interfaces';
import { Attack, StraightAttack } from './attacks';
import { Buff } from './buffs';
import { CharClass, getCharacteristicsFromClass, PlayerClass } from './classes';
import { states } from './state';
import { MovementResult, Strategy } from './strategy';

export type Characteristics = {
  s: number;
  p: number;
  e: number;
  a: number;
  i: number;
};

export function getEffectiveCharacteristics(character: Character, upgradesBought?: Record<string, number>): Characteristics {
  if (!upgradesBought) {
    return character.characteristics;
  }
  
  return {
    s: character.characteristics.s + (upgradesBought.strength || 0),
    p: character.characteristics.p + (upgradesBought.perception || 0),
    e: character.characteristics.e + (upgradesBought.endurance || 0),
    a: character.characteristics.a + (upgradesBought.agility || 0),
    i: character.characteristics.i + (upgradesBought.intelligence || 0),
  };
}

export function attackStrength(
  attack: Attack,
  char: Character,
  enemy: Character,
  attackerUpgrades?: Record<string, number>
) {
  const effectiveCharacteristics = getEffectiveCharacteristics(char, attackerUpgrades);
  const base =
    Math.random() * (attack.maxDamage - attack.minDamage) + attack.minDamage;
  const damage =
    base * (1 + 0.25 * effectiveCharacteristics.s) * (1 + 0.05 * char.level);
  const actualDamage = damage * (1 - 0.1 * enemy.characteristics.e);
  return actualDamage;
}

export function health(char: Character, upgradesBought?: Record<string, number>) {
  const effectiveCharacteristics = getEffectiveCharacteristics(char, upgradesBought);
  const HP =
    10 +
    (0.25 * effectiveCharacteristics.s + 0.5 * effectiveCharacteristics.e) * char.level;
  return HP;
}

export function regen(char: Character, upgradesBought?: Record<string, number>) {
  const effectiveCharacteristics = getEffectiveCharacteristics(char, upgradesBought);
  const regen = 0.05 * (effectiveCharacteristics.e + char.level);
  return regen;
}

export function FOV(char: Character, upgradesBought?: Record<string, number>) {
  const effectiveCharacteristics = getEffectiveCharacteristics(char, upgradesBought);
  const areaUp = 4 + Math.floor(0.5 * effectiveCharacteristics.p);
  const areaDown = Math.floor(0.5 * effectiveCharacteristics.p);
  const areaLeft = 2 + Math.floor(0.5 * effectiveCharacteristics.p);
  const areaRight = 2 + Math.floor(0.5 * effectiveCharacteristics.p);
  return {
    areaUp: areaUp,
    areaDown: areaDown,
    areaLeft: areaLeft,
    areaRight: areaRight,
  };
}

export function score(char: Character, enemy: Character, upgradesBought?: Record<string, number>) {
  const effectiveCharacteristics = getEffectiveCharacteristics(char, upgradesBought);
  const score = effectiveCharacteristics.i * 0.25 + enemy.level;
  return score;
}

export function speed(char: Character, upgradesBought?: Record<string, number>) {
  const effectiveCharacteristics = getEffectiveCharacteristics(char, upgradesBought);
  const agilityValue = effectiveCharacteristics.a;
  
  if (agilityValue <= 2) {
    return Speed.SUPERSLOW;
  } else if (agilityValue <= 4) {
    return Speed.SLOW;
  } else if (agilityValue <= 6) {
    return Speed.NORMAL;
  } else if (agilityValue <= 8) {
    return Speed.FAST;
  } else {
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

export function AttackOutcome(char: Character, enemy: Character, attackerUpgrades?: Record<string, number>, enemyUpgrades?: Record<string, number>) {
  const attackerCharacteristics = getEffectiveCharacteristics(char, attackerUpgrades);
  const enemyCharacteristics = getEffectiveCharacteristics(enemy, enemyUpgrades);
  
  const { phi_miss, phi_redirected, phi_self_hit, phi_normal } =
    calculateAttackProbabilities(attackerCharacteristics, enemyCharacteristics);
  
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
      char.character.healthBar -= damage;
      finalTarget = char;
      break;
    }
    case 'self-hit': {
      damage = attackStrength(attack, char.character, char.character);
      char.character.healthBar -= damage;
      finalTarget = char;
      break;
    }
    case 'normal': {
      damage = attackStrength(attack, char.character, enemy.character);
      enemy.character.healthBar -= damage;
      break;
    }
  }
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

export function calculateExperienceFromKill(player: Character, enemyLevel: number, upgradesBought?: Record<string, number>): number {
  const effectiveCharacteristics = getEffectiveCharacteristics(player, upgradesBought);
  const baseExperience = 10;
  const levelDifference = enemyLevel - player.level;
  const multiplier = Math.max(0.5, 1 + levelDifference * 0.2);
  const intelligenceBonus = 1 + (effectiveCharacteristics.i * 0.1); // 10% bonus per intelligence point
  return Math.floor(baseExperience * multiplier * enemyLevel * intelligenceBonus);
}

export function calculateExperienceForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function canLevelUp(experience: number, experienceToNext: number): boolean {
  return experience >= experienceToNext;
}

export function levelUp(entity: Entity & { experience: number; experienceToNext: number }): { level: number; experience: number; experienceToNext: number } {
  const newLevel = entity.level + 1;
  const remainingExperience = entity.experience - entity.experienceToNext;
  const newExperienceToNext = calculateExperienceForNextLevel(newLevel);
  
  return {
    level: newLevel,
    experience: remainingExperience,
    experienceToNext: newExperienceToNext
  };
}
