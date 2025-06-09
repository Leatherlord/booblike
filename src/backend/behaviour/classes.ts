import { Speed } from "../../common/interfaces";
import * as Attacks from "./attacks";

export function getSpeed(speed: Speed) {
    switch (speed) {
        case Speed.SUPERFAST: {
            return 100;
        }
        case Speed.FAST: {
            return 200;
        }
        case Speed.NORMAL: {
            return 300;
        }
        case Speed.SLOW: {
            return 400;
        }
        case Speed.SUPERSLOW: {
            return 500;
        }
    }
}

export interface CharClass {
    name: string;
    availableAttacks: Attacks.Attack[];
    numberOfAttacks: number;
    speed: Speed
}

export class PlayerClass implements CharClass {
    constructor() {
        this.name = "PLAYER";
        this.speed = Speed.NORMAL;
    }
    availableAttacks: Attacks.Attack[] = [];
    numberOfAttacks!: number;
    name: string;
    speed: Speed;
}

export let WeaklingClass: CharClass = {
    speed: Speed.NORMAL,
    name: "Weakling",
    availableAttacks:
        [
            Attacks.StraightAttack
        ],
    numberOfAttacks: 1
}

export let WeaklingFastClass: CharClass = {
    speed: Speed.SUPERFAST,
    name: "Weakling",
    availableAttacks:
        [
            Attacks.StraightAttack
        ],
    numberOfAttacks: 1
}

export let WeaklingSlowClass: CharClass = {
    speed: Speed.SUPERSLOW,
    name: "Weakling",
    availableAttacks:
        [
            Attacks.StraightAttack
        ],
    numberOfAttacks: 1
}