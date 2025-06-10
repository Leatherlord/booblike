import charClassesJson from './classes.json';
import attacksJson from './attacks.json';
import { CharClass } from '../behaviour/classes';
import { Attack } from '../behaviour/attacks';
import { Strategy, strategyMap } from '../behaviour/strategy';
import { states } from '../behaviour/state';
import { generateGrid, Speed } from '../../common/interfaces';

let _attackMap: Record<string, Attack> | null = null;
let _charClassMap: Record<string, CharClass> | null = null;

function convertJsonToCharClass(
    json: any,
    attackMap: Record<string, Attack>,
    strategyMap: Record<string, Strategy>
): CharClass {
    return {
        className: json.className,
        possibleNames: json.possibleNames,
        possibleSurnames: json.possibleSurnames,
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
    };
}

function convertJsonToAttackClass(json: any): Attack {
    const speed: Speed = Speed[json.speed as keyof typeof Speed];
    if (!speed) throw new Error(`Unknown speed: ${json.speed}`);
    const area = generateGrid(json.area);

    return {
        name: json.id,
        speed,
        minDamage: json.minDamage,
        maxDamage: json.maxDamage,
        attackBuffs: json.attackBuffs || [],
        areaSize: json.areaSize,
        area,
    };
}

export function getAttackMap(): Record<string, Attack> {
    if (!_attackMap) {
        _attackMap = Object.fromEntries(
            Object.entries(attacksJson).map(([id, data]) => [id, convertJsonToAttackClass(data)])
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