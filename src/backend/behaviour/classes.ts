import { Attack } from "./attacks";

export interface CharClass {
    name: string;
    availableAttacks?: Attack[];
}

export class PlayerClass implements CharClass {
    constructor() {
        this.name = "PLAYER";
    }
    name: string;
}