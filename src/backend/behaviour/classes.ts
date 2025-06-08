import * as Attacks from "./attacks";

export interface CharClass {
    name: string;
    availableAttacks: Attacks.Attack[];
    numberOfAttacks: number;
}

export class PlayerClass implements CharClass {
    constructor() {
        this.name = "PLAYER";
    }
    availableAttacks: Attacks.Attack[] = [];
    numberOfAttacks!: number;
    name: string;
}

export let WeaklingClass : CharClass = {
    name: "Weakling",
    availableAttacks: 
    [
        Attacks.CircleAttack
    ],
    numberOfAttacks: 1
}