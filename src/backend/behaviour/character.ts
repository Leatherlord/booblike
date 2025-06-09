import { Entity, generateGrid, Grid, LookDirection, Point2d, Room, Size, Speed, World } from "../../common/interfaces";
import { Attack } from "./attacks";
import * as attackPack from "./attacks";
import { Buff } from "./buffs";
import { CharClass, getSpeed, PlayerClass } from "./classes";
import { MovementResult } from "./state";
import { PlayerState, State } from "./state";

interface AttackResult {
    finalTarget: Entity;
    finalAttack: Attack;
    finalDamage: number;
    status: "normal" | "redirected" | "self-hit" | "missed";
}

function cloneCharacter(char: Character) {
    let copy = new PlayerCharacter(char.maxHealthBar);
    copy.state = char.state;
    copy.healthBar = char.maxHealthBar;
    copy.maxHealthBar = char.maxHealthBar;
    copy.charClass = char.charClass;
    copy.activeBuffs = char.activeBuffs;
    copy.attacks = char.attacks;
    copy.characterSize = char.characterSize;
    copy.areaSize = char.areaSize;
    copy.area = char.area;
    return copy;
}

export interface Character {
    state: State;
    healthBar: number;
    maxHealthBar: number;
    activeBuffs: Buff[];

    charClass: CharClass;
    attacks: Attack[];
    characterSize: Size;
    areaSize: Grid;
    area: Record<LookDirection, number[][]>

    clone: () => Character;
    move: (from: Point2d, lookDir: LookDirection, animation: {
        lastAttacked: number;
        lastMoved: number;
    }, world: World) => MovementResult;
    damage: (enemy: Entity, attack: Attack) => AttackResult;
    update: () => void; // runs in loop
    getSpeed: () => Speed;
    getAttackSpeed: (attack: Attack) => Speed;
}

export class PlayerCharacter implements Character {
    constructor(maxHealthBar: number) {
        this.state = new PlayerState();
        this.healthBar = maxHealthBar;
        this.maxHealthBar = maxHealthBar;
        this.charClass = new PlayerClass();
        this.activeBuffs = [];
        this.attacks = [attackPack.CircleAttack, attackPack.StraightAttack, attackPack.UnevenAttack, attackPack.SuperUnevenAttack];
        this.characterSize = { width: 1, height: 1 };

        this.areaSize = {
            areaUp: 0,
            areaDown: 2,
            areaRight: 1,
            areaLeft: 1
        },
            this.area = generateGrid(
                [
                    [1, 1, 1],
                    [1, 1, 1],
                    [1, 1, 1]
                ]
            );
    }
    state: State;
    healthBar: number;
    maxHealthBar: number;
    activeBuffs: Buff[];
    charClass: CharClass;
    attacks: Attack[];
    characterSize: Size;
    areaSize: Grid;
    area: Record<LookDirection, number[][]>

    public clone(): Character {
        return cloneCharacter(this);
    }
    public move(from: Point2d, lookDir: LookDirection, animation: {
        lastAttacked: number;
        lastMoved: number;
    }, world: World): MovementResult {
        const result: MovementResult = this.state.move({
            from: from, lookDir: lookDir, character: this, world: world, lastAttacked: animation.lastAttacked, lastMoved: animation.lastMoved
        });
        return result;
    }
    public damage(enemy: Entity, attack: Attack): AttackResult {
        let damage = Math.random() * (attack.maxDamage - attack.minDamage) + attack.minDamage;
        enemy.character.healthBar -= damage;
        return {
            finalTarget: enemy,
            finalAttack: attack,
            finalDamage: damage,
            status: "normal"
        };
    }
    public update(): void {
        throw "Cannot update yet";
    }

    public getSpeed(): Speed {
        return this.charClass.speed;
    }

    public getAttackSpeed(attack: Attack): Speed {
        return attack.speed * 10;
    }
}

export class DummyCharacter implements Character {
    constructor(state: State, charClass: CharClass, maxHealthBar: number) {
        this.state = state;
        this.healthBar = maxHealthBar;
        this.maxHealthBar = maxHealthBar;
        this.charClass = charClass;
        this.activeBuffs = [];

        const availableAttacks = charClass.availableAttacks;
        const indexOfAttacks: number[] = Array.from(Array(charClass.numberOfAttacks).keys());
        for (let i = indexOfAttacks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexOfAttacks[i], indexOfAttacks[j]] = [indexOfAttacks[j], indexOfAttacks[i]];
        }
        this.attacks = indexOfAttacks.map(index => availableAttacks[index]);

        this.characterSize = { width: 1, height: 1 }

        this.areaSize = {
            areaUp: 0,
            areaDown: 2,
            areaRight: 1,
            areaLeft: 1
        },
            this.area = generateGrid(
                [
                    [1, 1, 1],
                    [1, 1, 1],
                    [1, 1, 1]
                ]
            );
    }
    state: State;
    healthBar: number;
    maxHealthBar: number;
    activeBuffs: Buff[];
    charClass: CharClass;
    attacks: Attack[];
    characterSize: Size;
    areaSize: Grid;
    area: Record<LookDirection, number[][]>

    public clone(): Character {
        return cloneCharacter(this);
    }
    public move(from: Point2d, lookDir: LookDirection, animation: {
        lastAttacked: number;
        lastMoved: number;
    }, world: World): MovementResult {
        const result: MovementResult = this.state.move({
            from: from, lookDir: lookDir, character: this, lastAttacked: animation.lastAttacked, lastMoved: animation.lastMoved, world: world
        });
        return result;
    }
    public damage(enemy: Entity, attack: Attack): AttackResult {
        let damage = Math.random() * (attack.maxDamage - attack.minDamage) + attack.minDamage;
        enemy.character.healthBar -= damage;
        return {
            finalTarget: enemy,
            finalAttack: attack,
            finalDamage: damage,
            status: "normal"
        };
    }
    public update(): void {
        throw "Cannot update yet";
    }

    public getSpeed(): Speed {
        return this.charClass.speed;
    }

    public getAttackSpeed(attack: Attack): Speed {
        return attack.speed * 10;
    }
}