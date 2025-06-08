import { Entity, Point2d, Size, World } from "../../common/interfaces";
import {Attack} from "./attacks";
import * as attack from "./attacks";
import { Buff } from "./buffs";
import { CharClass, PlayerClass } from "./classes";
import { MovementResult } from "./movement";
import { PlayerState, State } from "./state";

export interface AttackResult {
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
    return copy;
}

function attackCharacter(char: Character, enemy: Entity, attack: Attack) {
    let damage = Math.random() * (attack.maxDamage - attack.minDamage) + attack.minDamage;
    enemy.character.healthBar -= damage;
    return {
        finalTarget: enemy,
        finalAttack: attack,
        finalDamage: damage,
        status: "normal"
    };
}

export interface Character {
    state: State;
    healthBar: number;
    maxHealthBar: number;
    activeBuffs: Buff[];

    charClass: CharClass;
    attacks: Attack[];
    characterSize: Size;

    clone: () => Character;
    move: (from: Point2d, world: World) => MovementResult;
    attack: (enemy : Entity, attack: Attack) => AttackResult;
    update: () => void; // runs in loop
}

export class PlayerCharacter implements Character {
    constructor(maxHealthBar: number) {
        this.state = new PlayerState();
        this.healthBar = maxHealthBar;
        this.maxHealthBar = maxHealthBar;
        this.charClass = new PlayerClass();
        this.activeBuffs = []
        this.attacks = [attack.CircleAttack, attack.StraightAttack, attack.UnevenAttack, attack.SuperUnevenAttack]
        this.characterSize = {width:1, height:1}
    }
    state: State;
    healthBar: number;
    maxHealthBar: number;
    activeBuffs: Buff[];
    charClass: CharClass;
    attacks: Attack[];
    characterSize: Size;

    public clone(): Character {
        return cloneCharacter(this);
    }
    public move(from: Point2d, world: World): MovementResult {
        return this.state.move(from, world);
    }
    public attack(enemy : Entity, attack: Attack): AttackResult {
        //'Only normal supported for now'
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

        this.characterSize = {width:1, height:1}
    }
    state: State;
    healthBar: number;
    maxHealthBar: number;
    activeBuffs: Buff[];
    charClass: CharClass;
    attacks: Attack[];
    characterSize: Size;

    public clone(): Character {
        return cloneCharacter(this);
    }
    public move(from: Point2d, world: World): MovementResult {
        return this.state.move(from, world);
    }
    public attack(enemy : Entity, attack: Attack): AttackResult {
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
}