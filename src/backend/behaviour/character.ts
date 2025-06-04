import { Point2d } from "../../common/interfaces";
import {Attack} from "./attacks";
import * as attack from "./attacks";
import { Buff } from "./buffs";
import { CharClass, PlayerClass } from "./classes";
import { PlayerState, State } from "./state";

export interface AttackResult {
  finalTarget: Character;
  finalAttack: Attack;
  finalDamage: number;
  status: "normal" | "redirected" | "self-hit" | "missed";
}

export interface Character {
    state: State;
    healthBar: number;
    activeBuffs: Buff[];

    charClass: CharClass;
    attacks: Attack[];
    characterSize: Point2d;

    clone: () => Character;
    move: () => Point2d;
    attack: () => AttackResult;
    update: () => void; // runs in loop
}

export class PlayerCharacter implements Character {
    constructor(healthBar: number) {
        this.state = new PlayerState();
        this.healthBar = healthBar;
        this.charClass = new PlayerClass();
        this.activeBuffs = []
        this.attacks = [attack.CircleAttack, attack.StraightAttack]
        this.characterSize = {x:1, y:1}
    }
    state: State;
    healthBar: number;
    activeBuffs: Buff[];
    charClass: CharClass;
    attacks: Attack[];
    characterSize: Point2d;

    public clone(): Character {
        throw "Cannot clone player character yet.";
    }
    public move(): Point2d {
        return this.state.move();
    }
    public attack(): AttackResult {
        throw "Cannot attack yet";
    }
    public update(): void {
        throw "Cannot update yet";
    }
}