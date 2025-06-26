import { StringDecoder } from 'string_decoder';
import {
  Entity,
  Grid,
  Size,
  Speed,
  World,
  InventoryItem,
  LookDirection,
} from '../../common/interfaces';
import { Attack } from './attacks';
import {
  Buff,
  Instant,
  ModifierType,
  StatType,
  TargetType,
  isBonus,
  isEffect,
  isInstant,
} from './buffs';
import { CharClass, getCharacteristicsFromClass, PlayerClass } from './classes';
import { EventType, handleStateChange, states } from './state';
import { Aggresive, MovementResult, Strategy } from './strategy';
import { PriorityQueue } from 'typescript-collections';
import { chooseDecorator, FurryCharacter } from './actions';
import { strategyMap } from './strategy';
import { CLASSES } from '../data/classes';
import { BUFFS } from '../data/buffs';
import { ATTACKS } from '../data/attacks';

// Characteristics and Calculations based on them

export type Characteristics = {
  s: number;
  p: number;
  e: number;
  a: number;
  i: number;
};

export function getEffectiveCharacteristics(
  character: Character,
  upgradesBought?: Record<string, number>
): Characteristics {
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
  const effectiveCharacteristics = getEffectiveCharacteristics(
    char,
    attackerUpgrades
  );
  const base =
    Math.random() * (attack.maxDamage - attack.minDamage) + attack.minDamage;
  const damage =
    base * (1 + 0.25 * effectiveCharacteristics.s) * (1 + 0.05 * char.level);
  const actualDamage = damage * (1 - 0.1 * enemy.characteristics.e);
  return actualDamage;
}

export function health(
  char: Character,
  upgradesBought?: Record<string, number>
) {
  const effectiveCharacteristics = getEffectiveCharacteristics(
    char,
    upgradesBought
  );
  const HP =
    10 +
    (0.25 * effectiveCharacteristics.s + 0.5 * effectiveCharacteristics.e) *
      char.level;
  return HP;
}

export function regen(
  char: Character,
  upgradesBought?: Record<string, number>
) {
  const effectiveCharacteristics = getEffectiveCharacteristics(
    char,
    upgradesBought
  );
  const regen = 0.05 * (effectiveCharacteristics.e + char.level);
  return regen;
}

export function FOV(char: Character, upgradesBought?: Record<string, number>) {
  const effectiveCharacteristics = getEffectiveCharacteristics(
    char,
    upgradesBought
  );
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

export function score(
  char: Character,
  enemy: Character,
  upgradesBought?: Record<string, number>
) {
  const effectiveCharacteristics = getEffectiveCharacteristics(
    char,
    upgradesBought
  );
  const score = effectiveCharacteristics.i * 0.25 + enemy.level;
  return score;
}

export function speed(
  char: Character,
  upgradesBought?: Record<string, number>
) {
  const effectiveCharacteristics = getEffectiveCharacteristics(
    char,
    upgradesBought
  );
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

// Functions to calculate attacks

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

export function AttackOutcome(
  char: Character,
  enemy: Character,
  attackerUpgrades?: Record<string, number>,
  enemyUpgrades?: Record<string, number>
) {
  const attackerCharacteristics = getEffectiveCharacteristics(
    char,
    attackerUpgrades
  );
  const enemyCharacteristics = getEffectiveCharacteristics(
    enemy,
    enemyUpgrades
  );

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

export interface AttackResult {
  finalTarget: Entity;
  finalAttack: Attack;
  finalDamage: number;
  status: 'normal' | 'redirected' | 'self-hit' | 'miss';
}

function getDamage(char: Entity, enemy: Entity, attack: Attack): AttackResult {
  const attackOutcome = AttackOutcome(char.character, enemy.character);
  let damage: number = 0;
  let finalTarget: Entity = enemy;
  let finalAttacker: Entity = char;
  switch (attackOutcome) {
    case 'miss': {
      damage = 0;
      break;
    }
    case 'redirected': {
      damage = attackStrength(attack, enemy.character, char.character);
      char.character.healthBar -= damage;
      finalTarget = char;
      finalAttacker = enemy;
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
  handleStateChange(enemy, EventType.Anger);
  damage = applyTableOnAttack(damage, finalAttacker.character);
  applyBuffOnCharacter(attack.attackBuffs, finalAttacker, finalTarget);
  return {
    finalTarget: finalTarget,
    finalAttack: attack,
    finalDamage: damage,
    status: attackOutcome as 'normal' | 'redirected' | 'self-hit' | 'miss',
  };
}

// --------------------Buff system-------------------- //

/*
  BuffDuration - type which stores value about bonus buffs - modifications,
  time when it was appied and duration.
  This is the result of processing Buff type for temporary buffs.
  buff of Buff is used to output the buffs used on character.
*/
export type BuffDuration = {
  buff?: Buff;
  value?: number;
  action?: (world: World, entity: Entity) => void;
  startTime: number;
  duration: number;
};
/*
  BuffAddOns and BuffActions store temporary buffs in priority queues
  sorted by the time they are supposed to be out (from earliest).
  
  BuffAddOns store multiplications and additions of health, attack and attributes.
  
  BuffActions stores actions.
*/
function isBuffActive(currentTime: number, obj?: BuffDuration) {
  if (!obj) return false;
  return currentTime > obj.duration + obj.startTime;
}
const durationComparator = (a: BuffDuration, b: BuffDuration): number => {
  const durationA = a.duration + a.startTime;
  const durationB = b.duration + b.startTime;
  return durationA - durationB;
};
export type BuffAddOns = {
  [statType in StatType]: statType extends StatType.Attribute
    ? Record<
        ModifierType,
        Record<keyof Characteristics, PriorityQueue<BuffDuration>>
      >
    : Record<ModifierType, PriorityQueue<BuffDuration>>;
};
function createBuffAddOnsTable(): BuffAddOns {
  const table: Partial<BuffAddOns> = {};

  for (const stat of Object.values(StatType)) {
    if (stat === StatType.Attribute) {
      const attributeModifiers = {} as Record<
        ModifierType,
        Record<keyof Characteristics, PriorityQueue<BuffDuration>>
      >;
      for (const modifier of Object.values(ModifierType)) {
        const characteristics = {} as Record<
          keyof Characteristics,
          PriorityQueue<BuffDuration>
        >;
        for (const char of Object.keys(characteristics) as Array<
          keyof Characteristics
        >) {
          characteristics[char] = new PriorityQueue<BuffDuration>(
            durationComparator
          );
        }
        attributeModifiers[modifier] = characteristics;
      }
      table[stat] = attributeModifiers;
    } else {
      const modifiers = {} as Record<ModifierType, PriorityQueue<BuffDuration>>;
      for (const modifier of Object.values(ModifierType)) {
        modifiers[modifier] = new PriorityQueue<BuffDuration>(
          durationComparator
        );
      }
      table[stat] = modifiers;
    }
  }
  return table as BuffAddOns;
}
/*
  type for controlling changes in table for less calculations
*/
type buffsChanged = {
  healthChanged: boolean;
  attackChanged: boolean;
  attributeChanged: {
    s: boolean;
    p: boolean;
    e: boolean;
    a: boolean;
    i: boolean;
  };
};
/*
  Functions which delete instances with expired time
*/
const filterQueue = (
  q: PriorityQueue<BuffDuration>,
  currentTime: number
): boolean => {
  let changed = false;
  const temp: BuffDuration[] = [];
  while (!q.isEmpty()) {
    temp.push(q.dequeue()!);
  }
  for (const buff of temp) {
    if (!isBuffActive(currentTime, buff)) {
      q.enqueue(buff);
    } else {
      changed = true;
    }
  }
  return changed;
};
function filterExpiredBuffs(table: BuffAddOns, currentTime: number) {
  let healthChanged = false;
  let attackChanged = false;
  const attributeChanged: Record<keyof Characteristics, boolean> = {
    s: false,
    p: false,
    e: false,
    a: false,
    i: false,
  };
  for (const modifier of Object.values(ModifierType)) {
    if (modifier in table[StatType.Health]) {
      healthChanged ||= filterQueue(
        table[StatType.Health][modifier],
        currentTime
      );
    }
    if (modifier in table[StatType.Attack]) {
      attackChanged ||= filterQueue(
        table[StatType.Attack][modifier],
        currentTime
      );
    }
  }
  for (const modifier of Object.values(ModifierType)) {
    const attrTable = table[StatType.Attribute][modifier];
    if (!attrTable) continue;
    for (const key of Object.keys(
      table[StatType.Attribute][modifier]
    ) as (keyof Characteristics)[]) {
      const attr = attrTable[key];
      const changed = filterQueue(attr, currentTime);
      if (changed) attributeChanged[key] ||= true;
    }
  }
  return { healthChanged, attackChanged, attributeChanged };
}
/*
  Functions which apply the effects of queues to character traits
*/
const applyQueue = (
  attribute: number,
  q: PriorityQueue<BuffDuration>,
  isMult: boolean
) => {
  let ans = attribute;
  if (!q) return ans;
  q.forEach((buff) => {
    if (isMult) {
      ans *= buff.value ? buff.value : 1;
    } else {
      ans += buff.value ? buff.value : 0;
    }
  });
  return ans;
};
function applyTableOnAttack(baseAttackValue: number, char: Character) {
  const table = char.buffsBonus;
  let multResult = applyQueue(baseAttackValue, table['ATTACK']['MULT'], true);
  const attack = applyQueue(multResult, table['ATTACK']['FLAT'], false);
  return attack;
}
function applyTableOnHealth(char: Character) {
  const table = char.buffsBonus;
  let multResult = applyQueue(
    char.baseMaxHealthBar,
    table['HEALTH']['MULT'],
    true
  );
  char.maxHealthBar = applyQueue(multResult, table['HEALTH']['FLAT'], false);
  return char.maxHealthBar;
}
function applyTableOnAttribute(char: Character, key: keyof Characteristics) {
  const table = char.buffsBonus;
  char.characteristics[key] = char.baseCharacteristics[key];
  const q1 = table['ATTRIBUTE']['MULT'][key];
  if (q1) {
    char.characteristics[key] = applyQueue(char.characteristics[key], q1, true);
  }
  const q2 = table['ATTRIBUTE']['FLAT'][key];
  if (q2) {
    char.characteristics[key] = applyQueue(
      char.characteristics[key],
      q2,
      false
    );
  }
}
/*
  Functions which recalculate character's base and 'enhanced' traits
*/
function recalculateAttributes(
  char: Character,
  ifChanged: {
    s: boolean;
    p: boolean;
    e: boolean;
    a: boolean;
    i: boolean;
  }
) {
  // recalculates attributes - always goes first
  let attributeChanged = false;
  for (const key of Object.keys(
    char.characteristics
  ) as (keyof Characteristics)[]) {
    if (ifChanged[key]) {
      applyTableOnAttribute(char, key);
      attributeChanged = true;
    }
  }
  return attributeChanged;
}
function recalculateBaseValues(entity: any) {
  // recalculates stuff affected by attributes
  const char = entity.character;
  if (entity.upgradesBought) {
    char.baseMaxHealthBar = health(char, entity.upgradesBought); // maxHealthBar is updated later
    char.areaSize = FOV(char, entity.upgradesBought);
    char.speed = speed(char, entity.upgradesBought);
  } else {
    char.baseMaxHealthBar = health(char); // maxHealthBar is updated later
    char.areaSize = FOV(char);
    char.speed = speed(char);
  }
}
function recalculateHealth(char: Character): void {
  const previousMaxHealth = char.maxHealthBar;
  const newMaxHealth = applyTableOnHealth(char);
  if (typeof newMaxHealth !== 'number' || newMaxHealth <= 0) {
    throw new Error(`Invalid max health value: ${newMaxHealth}`);
  }
  char.maxHealthBar = newMaxHealth;
  if (newMaxHealth > previousMaxHealth) {
    const healthIncrease = newMaxHealth - previousMaxHealth;
    char.healthBar = Math.min(char.healthBar + healthIncrease, newMaxHealth);
  } else if (char.healthBar > newMaxHealth) {
    char.healthBar = newMaxHealth;
  }
  char.healthBar = Math.max(0, char.healthBar);
}
export function recalculatePlayerStats(entity: Entity, changed?: buffsChanged) {
  // recalculates everything for player
  let ifChanged = changed
    ? changed
    : {
        healthChanged: true,
        attackChanged: true,
        attributeChanged: {
          s: true,
          p: true,
          e: true,
          a: true,
          i: true,
        },
      };
  const char = entity.character;
  const attributeChanged = recalculateAttributes(
    char,
    ifChanged.attributeChanged
  );

  recalculateBaseValues(entity);
  if (attributeChanged || ifChanged.healthChanged) recalculateHealth(char);
}

function applyAction(
  finalToEntity: Entity,
  buff: Buff,
  currentChild?: Character
) {
  const finalTo = currentChild ? currentChild : finalToEntity.character;

  let deepest = finalTo;
  const visited = new Set<Character>();

  while (deepest.childCharacter && !visited.has(deepest)) {
    visited.add(deepest);
    deepest = deepest.childCharacter;
  }

  const newDecorator = chooseDecorator(deepest, buff);
  if (newDecorator) {
    deepest.childCharacter = newDecorator;
    finalToEntity.character = finalTo.childCharacter || finalTo;
  }
}

function applyInstant(finalToEntity: Entity, buff: Buff) {
  let instant = buff.effect as Instant;
  finalToEntity.character.healthBar += instant.heal ? instant.heal : 0;
  finalToEntity.character.healthBar -= instant.damage ? instant.damage : 0;
}

/*
  Function which applies bonus and action buffs from type Buff
*/
function applyBuffOnCharacter(
  buffs: Buff[],
  fromEntity: Entity,
  toEntity?: Entity
) {
  let from = fromEntity.character;
  let to = toEntity?.character;
  let finalTo = to ? to : from;
  let finalToEntity = toEntity ? toEntity : fromEntity;
  for (const buff of buffs) {
    if (!buff) continue;
    // use chance to apply to see if can apply
    const chance = Math.random();
    if (chance > buff.chanceToApply) {
      continue;
    }
    // Choose Target
    switch (buff.targetType) {
      case TargetType.Self: {
        finalTo = from;
        finalToEntity = fromEntity;
        break;
      }
      case TargetType.Enemy: {
        if (!to || !toEntity) continue;
        finalTo = to;
        finalToEntity = toEntity;
        break;
      }
      case TargetType.Random: {
        const rand = Math.random();
        if (rand >= 0.5) {
          finalTo = from;
          finalToEntity = fromEntity;
        } else {
          if (!to || !toEntity) continue;
          finalTo = to;
          finalToEntity = toEntity;
        }
        break;
      }
    }
    const duration = buff.duration.duration;
    const startTime = Date.now();

    let result: BuffDuration = {
      startTime: startTime,
      duration: duration,
    };
    finalTo.allBuffs.enqueue({
      buff: buff,
      startTime: Date.now(),
      duration: buff.duration.duration,
    });
    if (isBonus(buff.effect)) {
      const table = finalTo.buffsBonus;
      result.value = buff.effect.value;
      if (buff.effect.statType == 'ATTRIBUTE') {
        if (buff.effect.attributeType) {
          if (
            !table[buff.effect.statType][buff.effect.modifierType][
              buff.effect.attributeType
            ]
          ) {
            table[buff.effect.statType][buff.effect.modifierType][
              buff.effect.attributeType
            ] = new PriorityQueue<BuffDuration>(durationComparator);
          }
          table[buff.effect.statType][buff.effect.modifierType][
            buff.effect.attributeType
          ].enqueue(result);
        }
      } else {
        table[buff.effect.statType][buff.effect.modifierType].enqueue(result);
      }
    } else if (isEffect(buff.effect)) {
      applyAction(finalToEntity, buff);
    } else if (isInstant(buff.effect)) {
      applyInstant(finalToEntity, buff);
    } else {
      console.error('Buff not supported: ', buff);
    }
  }
  const changed = {
    healthChanged: true,
    attackChanged: true,
    attributeChanged: {
      s: true,
      p: true,
      e: true,
      a: true,
      i: true,
    },
  };
  recalculatePlayerStats(fromEntity, changed);
  if (toEntity) recalculatePlayerStats(toEntity, changed);
}

// -------------------------CHARACTER CLASS------------------------- //

export interface Character {
  name: string;
  surname?: string;
  texture?: string;

  strategy: Strategy;
  healthBar: number;
  baseMaxHealthBar: number;
  maxHealthBar: number;

  charClass: CharClass;
  attacks: Attack[];
  characterSize: Size;
  areaSize: Grid;
  level: number;
  baseCharacteristics: Characteristics;
  characteristics: Characteristics;
  score?: number;
  speed: Speed;

  state: states;

  buffsBonus: BuffAddOns;
  allBuffs: PriorityQueue<BuffDuration>;
  inheritedCharacter?: Character;
  childCharacter?: Character;

  move: (context: Entity, world: World) => MovementResult;
  damage: (context: Entity, enemy: Entity, attack: Attack) => AttackResult;
  update: (context: Entity, world: World) => void; // runs in loop
  getSpeed: () => Speed;
  getAttackSpeed: (attack: Attack) => Speed;
  setState: (state: states) => void;
  applyBuff: (context: Entity, buffs: Buff[]) => void;
  onDeath: (context: Entity, world: World) => void;
  equipWeapon: (weapon: InventoryItem | undefined, context?: Entity) => void;

  getTexture: () => string;
  getBuffs: () => PriorityQueue<BuffDuration>;

  serialize: () => any;
}

export class BaseCharacter implements Character {
  surname?: string | undefined;
  name!: string;
  texture?: string;
  charClass!: CharClass;
  attacks!: Attack[];
  characterSize!: Size;
  areaSize!: Grid;

  strategy!: Strategy;
  state!: states;
  buffsBonus!: BuffAddOns;

  level!: number;
  characteristics!: Characteristics;
  speed!: Speed;
  baseMaxHealthBar!: number;
  baseCharacteristics!: Characteristics;
  maxHealthBar!: number;

  score?: number;
  healthBar!: number;

  childCharacter?: Character;
  allBuffs!: PriorityQueue<BuffDuration>;

  public move(context: Entity, world: World): MovementResult {
    const { animation, lookDir, x, y } = context;
    const from = { x: x, y: y };
    const result: MovementResult = this.strategy.move(context, world);
    return result;
  }
  public damage(context: Entity, enemy: Entity, attack: Attack): AttackResult {
    return getDamage(context, enemy, attack);
  }
  public update(context: any, world: World): void {
    const currentTime = Date.now();
    // filter expired buffs
    const changedQueue = filterQueue(this.allBuffs, currentTime);
    if (changedQueue) {
      const changed = filterExpiredBuffs(this.buffsBonus, currentTime);
      recalculatePlayerStats(context, changed);
    }
    // regenerate
    if (context.upgradesBought) {
      this.healthBar = Math.min(
        this.maxHealthBar,
        this.healthBar + regen(this, context.upgradesBought)
      );
    } else {
      this.healthBar = Math.min(
        this.maxHealthBar,
        this.healthBar + regen(this)
      );
    }
    // state changes for health change
    handleStateChange(context, EventType.Damage);
    handleStateChange(context, EventType.Heal);
  }

  public getSpeed(): Speed {
    return this.speed;
  }

  public getAttackSpeed(attack: Attack): Speed {
    return attack.speed * 5;
  }

  public setState(state: states): void {
    this.state = state;
  }

  public applyBuff(context: Entity, buffs: Buff[]): void {
    applyBuffOnCharacter(buffs, context);
    recalculatePlayerStats(context);
  }
  public onDeath(context: Entity, world: World): void {}
  public getTexture(): string {
    if (this.texture) return this.texture;
    return '';
  }

  public getBuffs(): PriorityQueue<BuffDuration> {
    return this.allBuffs;
  }

  public serialize(): any {
    const strategyName =
      Object.keys(strategyMap).find(
        (key) => strategyMap[key].constructor === this.strategy.constructor
      ) || 'Aggresive';

    return {
      ...this,
      _characterType: 'BaseCharacter',
      _strategyName: strategyName,
      _charClassName: this.charClass.className,
      strategy: undefined,
      charClass: undefined,
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

  static deserialize(data: any): BaseCharacter {
    const char = new BaseCharacter();

    const {
      strategy,
      _characterType,
      _strategyName,
      _charClassName,
      charClass,
      ...cleanData
    } = data;
    Object.assign(char, cleanData);

    if (data._charClassName) {
      char.charClass = CLASSES[data._charClassName] || PlayerClass;
    } else {
      char.charClass = PlayerClass; // fallback
    }

    char.strategy = strategyMap[data._strategyName] || strategyMap['Aggresive'];

    if (data.allBuffs) {
      char.allBuffs = BaseCharacter.reconstructPriorityQueue(data.allBuffs);
    }
    if (data.buffsBonus) {
      char.buffsBonus = BaseCharacter.reconstructBuffAddOns(data.buffsBonus);
    }

    return char;
  }

  protected static reconstructPriorityQueue(
    queueData: any
  ): PriorityQueue<BuffDuration> {
    const durationComparator = (a: BuffDuration, b: BuffDuration): number => {
      const durationA = a.duration + a.startTime;
      const durationB = b.duration + b.startTime;
      return durationA - durationB;
    };

    const queue = new PriorityQueue<BuffDuration>(durationComparator);

    if (queueData) {
      let elements: any[] = [];

      if (queueData._elements && Array.isArray(queueData._elements)) {
        elements = queueData._elements;
      } else if (queueData.heap && Array.isArray(queueData.heap)) {
        elements = queueData.heap;
      } else if (queueData.data && Array.isArray(queueData.data)) {
        elements = queueData.data;
      } else if (Array.isArray(queueData)) {
        elements = queueData;
      }

      elements.forEach((element: any) => {
        if (element !== null && element !== undefined) {
          queue.enqueue(element);
        }
      });
    }

    return queue;
  }

  protected static reconstructBuffAddOns(buffsData: any): BuffAddOns {
    if (!buffsData) return buffsData;

    const durationComparator = (a: BuffDuration, b: BuffDuration): number => {
      const durationA = a.duration + a.startTime;
      const durationB = b.duration + b.startTime;
      return durationA - durationB;
    };

    const reconstructed: any = {};

    Object.keys(buffsData).forEach((statType) => {
      reconstructed[statType] = {};

      Object.keys(buffsData[statType]).forEach((modifierType) => {
        if (statType === 'ATTRIBUTE') {
          reconstructed[statType][modifierType] = {};
          Object.keys(buffsData[statType][modifierType]).forEach((attrType) => {
            reconstructed[statType][modifierType][attrType] =
              BaseCharacter.reconstructPriorityQueue(
                buffsData[statType][modifierType][attrType]
              );
          });
        } else {
          reconstructed[statType][modifierType] =
            BaseCharacter.reconstructPriorityQueue(
              buffsData[statType][modifierType]
            );
        }
      });
    });

    return reconstructed;
  }

  public equipWeapon(
    weapon: InventoryItem | undefined,
    context?: Entity
  ): void {}
}

export class PlayerCharacter extends BaseCharacter {
  private equippedWeapon?: InventoryItem;
  private baseAttacks: Attack[];

  constructor(
    name: string,
    characteristics: Characteristics,
    texture?: string
  ) {
    super();
    this.charClass = PlayerClass;
    this.strategy = this.charClass.strategy[states.Normal as states];
    this.attacks = [ATTACKS.StraightAttack];

    this.baseAttacks = [ATTACKS.StraightAttack];

    this.characterSize = { width: 1, height: 1 };
    this.level = 1;
    this.score = 0;
    this.state = states.Normal;

    this.baseCharacteristics = { ...characteristics };
    this.characteristics = { ...characteristics };
    this.name = name;

    this.baseMaxHealthBar = health(this);
    this.maxHealthBar = this.baseMaxHealthBar;
    this.healthBar = this.maxHealthBar;
    this.areaSize = FOV(this);
    this.speed = speed(this);

    this.buffsBonus = createBuffAddOnsTable();
    this.allBuffs = new PriorityQueue<BuffDuration>(durationComparator);

    if (texture) {
      this.texture = texture;
    } else {
      this.texture = 'player';
    }
  }

  public equipWeapon(weapon: InventoryItem | undefined, context?: Entity) {
    // Remove old weapon effects if any
    if (this.equippedWeapon?.characteristicsBonuses) {
      const characteristicKeys: (keyof Characteristics)[] = [
        's',
        'p',
        'e',
        'a',
        'i',
      ];

      for (const charKey of characteristicKeys) {
        const bonus = this.equippedWeapon.characteristicsBonuses[charKey];
        if (bonus && bonus !== 0) {
          const removeBuff: BuffDuration = {
            value: -bonus,
            startTime: Date.now(),
            duration: 0,
          };

          if (!this.buffsBonus[StatType.Attribute]) {
            this.buffsBonus[StatType.Attribute] = {} as any;
          }
          if (!this.buffsBonus[StatType.Attribute][ModifierType.Flat]) {
            this.buffsBonus[StatType.Attribute][ModifierType.Flat] = {} as any;
          }
          if (
            !this.buffsBonus[StatType.Attribute][ModifierType.Flat][charKey]
          ) {
            this.buffsBonus[StatType.Attribute][ModifierType.Flat][charKey] =
              new PriorityQueue<BuffDuration>(durationComparator);
          }

          this.buffsBonus[StatType.Attribute][ModifierType.Flat][
            charKey
          ].enqueue(removeBuff);
        }
      }
    }

    // Always reset to fresh base attacks
    this.attacks = [...this.baseAttacks];

    this.equippedWeapon = weapon;

    // Apply new weapon effects if any
    if (weapon?.characteristicsBonuses) {
      const characteristicKeys: (keyof Characteristics)[] = [
        's',
        'p',
        'e',
        'a',
        'i',
      ];

      for (const charKey of characteristicKeys) {
        const bonus = weapon.characteristicsBonuses[charKey];
        if (bonus && bonus !== 0) {
          const addBuff: BuffDuration = {
            value: bonus,
            startTime: Date.now(),
            duration: 0,
          };

          if (!this.buffsBonus[StatType.Attribute]) {
            this.buffsBonus[StatType.Attribute] = {} as any;
          }
          if (!this.buffsBonus[StatType.Attribute][ModifierType.Flat]) {
            this.buffsBonus[StatType.Attribute][ModifierType.Flat] = {} as any;
          }
          if (
            !this.buffsBonus[StatType.Attribute][ModifierType.Flat][charKey]
          ) {
            this.buffsBonus[StatType.Attribute][ModifierType.Flat][charKey] =
              new PriorityQueue<BuffDuration>(durationComparator);
          }

          this.buffsBonus[StatType.Attribute][ModifierType.Flat][
            charKey
          ].enqueue(addBuff);
        }
      }
    }

    if (weapon?.attack) {
      this.attacks = [weapon.attack];
    }

    if (context) {
      const changed = {
        healthChanged: true,
        attackChanged: true,
        attributeChanged: {
          s: true,
          p: true,
          e: true,
          a: true,
          i: true,
        },
      };
      recalculatePlayerStats(context, changed);
    } else {
      const changed = {
        s: true,
        p: true,
        e: true,
        a: true,
        i: true,
      };
      recalculateAttributes(this, changed);
    }
  }

  public serialize(): any {
    const baseData = super.serialize();
    return {
      ...baseData,
      _characterType: 'PlayerCharacter',
      _equippedWeapon: this.equippedWeapon,
    };
  }

  static deserialize(data: any): PlayerCharacter {
    const char = new PlayerCharacter(
      data.name,
      data.baseCharacteristics,
      data.texture
    );

    const constructorFields = [
      'name',
      'baseCharacteristics',
      'texture',
      'charClass',
      'strategy',
      'attacks',
      'characterSize',
      'level',
      'score',
      'state',
      'characteristics',
      'baseMaxHealthBar',
      'maxHealthBar',
      'healthBar',
      'areaSize',
      'speed',
      'buffsBonus',
      'allBuffs',
      'baseAttacks',
      'equippedWeapon',
    ];

    Object.keys(data).forEach((key) => {
      if (
        !constructorFields.includes(key) &&
        !key.startsWith('_') &&
        typeof (data as any)[key] !== 'function'
      ) {
        (char as any)[key] = (data as any)[key];
      }
    });

    char.charClass = PlayerClass;

    const currentState = (data.state as states) || states.Normal;
    char.strategy = PlayerClass.strategy[currentState];

    if (data.allBuffs) {
      char.allBuffs = BaseCharacter.reconstructPriorityQueue(data.allBuffs);
    }
    if (data.buffsBonus) {
      char.buffsBonus = BaseCharacter.reconstructBuffAddOns(data.buffsBonus);
    }

    if (data._equippedWeapon) {
      char.equipWeapon(data._equippedWeapon);
    }

    return char;
  }
}

export class RandomEnemyCharacter extends BaseCharacter {
  constructor(charClass: CharClass) {
    super();
    this.charClass = charClass;
    const { name, surname, characteristics, attacks, strategy, texture } =
      getCharacteristicsFromClass(charClass);
    this.name = name;
    this.surname = surname;
    this.attacks = attacks;
    this.strategy = strategy;
    this.state = states.Normal;

    this.characterSize = { width: 1, height: 1 };

    //this.level = Math.max(1, player.level + (Math.random() < 0.5 ? -1 : 1)); // align to player kinda | maybe difficulty later
    this.level = 1;

    this.baseCharacteristics = { ...characteristics };
    this.characteristics = { ...characteristics };
    this.name = name;

    this.baseMaxHealthBar = health(this);
    this.maxHealthBar = this.baseMaxHealthBar;
    this.healthBar = this.maxHealthBar;
    this.areaSize = FOV(this);
    this.speed = speed(this);

    this.buffsBonus = createBuffAddOnsTable();
    this.allBuffs = new PriorityQueue<BuffDuration>(durationComparator);
    if (texture) this.texture = texture;
  }

  public serialize(): any {
    const baseData = super.serialize();
    return {
      ...baseData,
      _characterType: 'RandomEnemyCharacter',
    };
  }

  static deserialize(data: any): RandomEnemyCharacter {
    let restoredCharClass: CharClass;
    if (data._charClassName) {
      restoredCharClass = CLASSES[data._charClassName];
      if (!restoredCharClass) {
        console.warn(
          `CharClass not found: ${data._charClassName}, using fallback`
        );
        restoredCharClass = Object.values(CLASSES)[0] || PlayerClass;
      }
    } else {
      restoredCharClass = Object.values(CLASSES)[0] || PlayerClass;
    }

    const char = new RandomEnemyCharacter(restoredCharClass);

    const constructorFields = [
      'charClass',
      'name',
      'surname',
      'attacks',
      'strategy',
      'state',
      'characterSize',
      'level',
      'baseCharacteristics',
      'characteristics',
      'baseMaxHealthBar',
      'maxHealthBar',
      'healthBar',
      'areaSize',
      'speed',
      'buffsBonus',
      'allBuffs',
      'texture',
    ];

    Object.keys(data).forEach((key) => {
      if (
        !constructorFields.includes(key) &&
        !key.startsWith('_') &&
        typeof (data as any)[key] !== 'function'
      ) {
        (char as any)[key] = (data as any)[key];
      }
    });

    char.charClass = restoredCharClass;

    const strategyName = data._strategyName || 'Aggresive';
    char.strategy = strategyMap[strategyName] || strategyMap['Aggresive'];

    if (data.allBuffs) {
      char.allBuffs = BaseCharacter.reconstructPriorityQueue(data.allBuffs);
    }
    if (data.buffsBonus) {
      char.buffsBonus = BaseCharacter.reconstructBuffAddOns(data.buffsBonus);
    }

    return char;
  }
}

// -------------------------LEVEL SYSTEM------------------------- //

export function calculateExperienceFromKill(
  player: Character,
  enemyLevel: number,
  upgradesBought?: Record<string, number>
): number {
  const effectiveCharacteristics = getEffectiveCharacteristics(
    player,
    upgradesBought
  );
  const baseExperience = 10;
  const levelDifference = enemyLevel - player.level;
  const multiplier = Math.max(0.5, 1 + levelDifference * 0.2);
  const intelligenceBonus = 1 + effectiveCharacteristics.i * 0.1; // 10% bonus per intelligence point
  return Math.floor(
    baseExperience * multiplier * enemyLevel * intelligenceBonus
  );
}

export function calculateExperienceForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function canLevelUp(
  experience: number,
  experienceToNext: number
): boolean {
  return experience >= experienceToNext;
}

export function levelUp(
  entity: Entity & { experience: number; experienceToNext: number }
): { level: number; experience: number; experienceToNext: number } {
  const newLevel = entity.level + 1;
  const remainingExperience = entity.experience - entity.experienceToNext;
  const newExperienceToNext = calculateExperienceForNextLevel(newLevel);

  return {
    level: newLevel,
    experience: remainingExperience,
    experienceToNext: newExperienceToNext,
  };
}
