import { Entity, getGridSize, getOffsetsByPos, LookDirection, Point2d, Room, Size, World } from "../../common/interfaces";
import { Attack } from "./attacks";
import { aggressiveMovement, cowardMovement, neutralMovement } from "./movement";
import * as attackPack from "./attacks";
import { Character } from "./character";

function processAttack(room: Room, from: Character, attack: Attack, pos: Point2d) {
    const entities = room.entities;
    entities.get(pos).forEach(function (entity) {
        console.log("Spotted an entity:", entity);

        let attackResult = from.damage(entity, attack,);
        if (
            attackResult.status == 'normal'
            &&
            attackResult.finalTarget.character.healthBar <= 0
        )
            entities.delete(pos, entity);
    });
}

function inBounds(
    mask: number[][], 
    pos: Point2d, 
    enemy: Point2d,
    offset: Point2d
): boolean {
    const dy = enemy.y - (pos.y - offset.y);
    const dx = enemy.x - (pos.x - offset.x);

    if (dy < 0 || dy >= mask.length || dx < 0 || dx >= mask[0].length) {
        return false;
    }

    return mask[dy][dx] === 1;
}

function attackOneEntity(
    attacker: Character, 
    attack: Attack, 
    lookDir: LookDirection, 
    pos: Point2d, 
    world: World, 
    enemy?: Entity,
) : AttackResult {
    if(!enemy) return { success: false, attackedTiles: [] };

    const { x: width, y: height } = getGridSize(attack.areaSize, lookDir);
    const offset = getOffsetsByPos(lookDir, attack);
    const mask = attack.area[lookDir];
    if(!inBounds(mask, pos, {x: enemy.x, y: enemy.y}, offset)) {
        console.log("!attackInBounds")
        return { success: false, attackedTiles: [] };
    }

    const attackResult = attacker.damage(enemy, attack);
    const room = world.map.rooms[world.map.currentRoom];
    if (
        attackResult.status == 'normal'
        &&
        attackResult.finalTarget.character.healthBar <= 0
    ) {
        room.entities.delete(pos, enemy);
    }

    const map = room.map;
    const attackedTiles: Point2d[] = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (mask[y][x] !== 1) continue;

            const targetX = pos.x + x - offset.x;
            const targetY = pos.y + y - offset.y;

            if (
                targetY >= 0 && targetY < map.length &&
                targetX >= 0 && targetX < map[0].length
            ) {
                const tile = map[targetY][targetX];
                if (tile === 'floor') {
                    attackedTiles.push({
                        x: targetX,
                        y: targetY
                    });
                }
            }
        }
    }
    console.log("attacked " + enemy.character.healthBar)
    return { success: true, attackedTiles: attackedTiles };
}

function attackAll(
    attacker: Character, 
    attack: Attack, 
    lookDir: LookDirection, 
    pos: Point2d, 
    world: World
) : AttackResult {
const { x: width, y: height } = getGridSize(attack.areaSize, lookDir);
    const { x: xOffset, y: yOffset } = getOffsetsByPos(lookDir, attack);
    const mask = attack.area[lookDir];

    const room = world.map.rooms[world.map.currentRoom];
    const map = room.map;
    const attackedTiles: Point2d[] = [];
    let success = false;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (mask[y][x] !== 1) continue;

            const targetX = pos.x + x - xOffset;
            const targetY = pos.y + y - yOffset;

            if (
                targetY >= 0 && targetY < map.length &&
                targetX >= 0 && targetX < map[0].length
            ) {
                const tile = map[targetY][targetX];
                const pos: Point2d = { x: targetX, y: targetY };

                if (room.entities.get(pos)) {
                    processAttack(room, attacker, attack, pos);
                    success = true;
                }

                if (tile === 'floor') {
                    attackedTiles.push(pos);
                }
            }
        }
    }
    return {
        success: success,
        attackedTiles: attackedTiles
    };
}

interface AttackResult {
    success: boolean;
    attackedTiles: Point2d[];
}

export type MovementResult = {
    to: Point2d
    lookDir?: LookDirection
    attackResult?: AttackResult
}

export type Context = {
    from: Point2d,
    lookDir: LookDirection,
    character: Character,
    world: World
}

export interface State {
    move: (context: Context) => MovementResult;
    attack: (context: Context, attack: Attack, enemy?: Entity) 
    => AttackResult
}

export class PlayerState implements State {
    public attack(
        context: Context, attack: Attack
    ): AttackResult {
        const {from, lookDir, character, world} = context;
        return attackAll(character, attack, lookDir, from, world);
    }
    public move(context: Context): MovementResult {
        const {from, lookDir, character, world} = context;
        let pos = neutralMovement(from, world);
        return {...pos};
    }
}

export class Aggresive implements State {
    public attack(
        context: Context, attack: Attack, enemy?: Entity
    ): AttackResult {
        const {from, lookDir, character, world} = context;
        return attackOneEntity(character, attack, lookDir, from, world, enemy);
    }
    public move(context: Context): MovementResult {
        const {from, lookDir, character, world} = context;
        let pos = aggressiveMovement(context);
        if(!pos.lookDir) pos.lookDir = lookDir;
        let attackResult;
        for(const attack of character.attacks) {
            let attackResult = this.attack(context, attack, world.player)
            if(attackResult.success) {
                console.log("ATTACKED")
                return {...pos, attackResult};
            }
        }
        return {...pos};
    }
}

export class Neutral implements State {
    public attack(
        context: Context, attack: Attack, enemy?: Entity
    ): AttackResult {
        const {from, lookDir, character, world} = context;
        return { success: false, attackedTiles: [] };
    }
    public move(context: Context): MovementResult {
        const {from, lookDir, character, world} = context;
        let pos = neutralMovement(from, world);
        return {...pos};
    }
}

export class Coward implements State {
    public attack(
        context: Context, attack: Attack, enemy?: Entity
    ): AttackResult {
        const {from, lookDir, character, world} = context;
        return { success: false, attackedTiles: [] };
    }
    public move(context: Context): MovementResult {
        const {from, lookDir, character, world} = context;
        let pos = cowardMovement(context);
        return {...pos};
    }
}

export class Fury implements State {
    public attack(
        context: Context, attack: Attack
    ): AttackResult {
        const {from, lookDir, character, world} = context;
        return attackAll(character, attack, lookDir, from, world);
    }
    public move(context: Context): MovementResult {
        const {from, lookDir, character, world} = context;
        let pos = neutralMovement(from, world);
        if(!pos.lookDir) pos.lookDir = lookDir;
        const attackChosen = Math.floor(Math.random() * character.attacks.length);
        let attackResult = this.attack(context, character.attacks[attackChosen]);
        return {...pos, attackResult};
    }
}
