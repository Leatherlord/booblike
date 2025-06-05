import { Entity, Point2d, Size } from "../../common/interfaces";
import {Attack} from "./attacks";
import * as attack from "./attacks";
import { Buff } from "./buffs";
import { CharClass, PlayerClass } from "./classes";
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

export interface Character {
    state: State;
    healthBar: number;
    maxHealthBar: number;
    activeBuffs: Buff[];

    charClass: CharClass;
    attacks: Attack[];
    characterSize: Size;

    clone: () => Character;
    move: () => Point2d;
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
    public move(): Point2d {
        return this.state.move();
    }
    public attack(enemy : Entity, attack: Attack): AttackResult {
        console.log('Only normal supported for now');
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

        const availableAttacks = [...charClass.availableAttacks];
        for (let i = availableAttacks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableAttacks[i], availableAttacks[j]] = [availableAttacks[j], availableAttacks[i]];
        }
        this.attacks = availableAttacks.slice(0, charClass.numberOfAttacks);

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
    public move(): Point2d {
        return this.state.move();
    }
    public attack(enemy : Entity, attack: Attack): AttackResult {
        throw "Cannot attack yet";
    }
    public update(): void {
        throw "Cannot update yet";
    }
}