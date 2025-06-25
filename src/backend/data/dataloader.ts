import charClassesJson from './classes.json';
import attacksJson from './attacks.json';
import bonusesJson from './bonuses.json';
import effectsJson from './effects.json';
import buffsJson from './buffs.json';
import { CharClass } from '../behaviour/classes';
import { Attack } from '../behaviour/attacks';
import { Strategy, strategyMap } from '../behaviour/strategy';
import { states } from '../behaviour/state';
import { generateGrid, Speed } from '../../common/interfaces';
import { Bonus, Buff, Effect } from '../behaviour/buffs';
import { buffer } from 'node:stream/consumers';

let _attackMap: Record<string, Attack> | null = null;
let _charClassMap: Record<string, CharClass> | null = null;
let _effectsMap: Record<string, Effect | Bonus> | null = null;
let _buffsMap: Record<string, Buff> | null = null;

function convertJsonToCharClass(
  json: any,
  attackMap: Record<string, Attack>,
  strategyMap: Record<string, Strategy>
): CharClass {
  return {
    className: json.className,
    possibleNames: json.possibleNames,
    possibleSurnames: json.possibleSurnames,
    possibleTextures: json.possibleTextures,
    characteristicsBounds: json.characteristicsBounds,
    availableAttacks: json.availableAttacks.map((name: string) => {
      const attack = attackMap[name];
      if (!attack) {
        throw new Error(`Unknown attack: ${name}`);
      }
      return attack;
    }),
    numberOfAttacks: json.numberOfAttacks,
    strategy: Object.fromEntries(
      Object.entries(json.strategy).map(([state, stratName]) => {
        const stratNameStr = stratName as string;
        if (!(stratNameStr in strategyMap)) {
          throw new Error(`Unknown strategy name: ${stratName}`);
        }
        return [state, strategyMap[stratNameStr]];
      })
    ) as Record<states, Strategy>,
    transitions: json.transitions,
  };
}

function convertJsonToEffectsClass(json: any): Effect {
  return {
    name: json.name,
    applyEffect: json.applyEffect,
  };
}

function convertJsonToBonusesClass(json: any): Bonus {
  return {
    name: json.id,
    statType: json.statType,
    attributeType: json.attributeType,
    modifierType: json.modifierType,
    value: json.value,
  };
}

function convertJsonToBuffClass(
  json: any,
  effects: Record<string, Effect | Bonus>
): Buff {
  return {
    name: json.id,
    targetType: json.targetType,
    duration: {
      duration: json.duration.duration,
      type: json.duration.type,
    },
    effect: effects[json.effect],
  };
}

function convertJsonToAttackClass(
  json: any,
  buffsMap: Record<string, Buff>
): Attack {
  const speed: Speed = Speed[json.speed as keyof typeof Speed];
  if (!speed) throw new Error(`Unknown speed: ${json.speed}`);
  const area = generateGrid(json.area);

  let buffs = [];
  for (let buff of json.attackBuffs) {
    if (buffsMap[buff]) {
      buffs.push(buffsMap[buff]);
      console.log(buffsMap[buff].name);
    }
  }

  return {
    name: json.id,
    speed,
    minDamage: json.minDamage,
    maxDamage: json.maxDamage,
    attackBuffs: buffs || [],
    areaSize: json.areaSize,
    area,
  };
}

export function getAttackMap(): Record<string, Attack> {
  if (!_attackMap) {
    const effects = getBuffsClassMap();
    _attackMap = Object.fromEntries(
      Object.entries(attacksJson).map(([id, data]) => [
        id,
        convertJsonToAttackClass(data, effects),
      ])
    );
  }
  return _attackMap;
}

export function getCharClassMap(): Record<string, CharClass> {
  if (!_charClassMap) {
    const attacks = getAttackMap();
    _charClassMap = Object.fromEntries(
      Object.entries(charClassesJson).map(([id, data]) => [
        id,
        convertJsonToCharClass(data, attacks, strategyMap),
      ])
    );
  }
  return _charClassMap;
}

export function getEffectsClassMap() {
  if (!_effectsMap) {
    _effectsMap = Object.fromEntries([
      ...Object.entries(effectsJson).map(([id, data]) => [
        id,
        convertJsonToEffectsClass(data),
      ]),
      ...Object.entries(bonusesJson).map(([id, data]) => [
        id,
        convertJsonToBonusesClass(data),
      ]),
    ]);
  }
  return _effectsMap!;
}

export function getBuffsClassMap() {
  if (!_buffsMap) {
    const effects = getEffectsClassMap();
    _buffsMap = Object.fromEntries(
      Object.entries(buffsJson).map(([id, data]) => [
        id,
        convertJsonToBuffClass(data, effects),
      ])
    );
  }
  return _buffsMap;
}
