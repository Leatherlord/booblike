import {
  Entity,
  getGridSize,
  getOffsetsByPos,
  LookDirection,
  Point2d,
  Room,
  Size,
  World,
} from '../../common/interfaces';
import { Attack } from './attacks';
import {
  aggressiveMovement,
  cowardMovement,
  neutralMovement,
} from './movement';

function processEntityDeath(
  deadEntity: Entity,
  attacker: Entity,
  world: World
) {
  const room = world.map.rooms[world.map.currentRoom];

  room.entities.delete({ x: deadEntity.x, y: deadEntity.y }, deadEntity);

  if (
    world.onEntityDeath &&
    attacker === world.player &&
    deadEntity !== world.player
  ) {
    world.onEntityDeath(deadEntity, attacker);
  }
}

function processAttack(
  room: Room,
  from: Entity,
  attack: Attack,
  pos: Point2d,
  world: World
) {
  const entities = room.entities;
  entities.get(pos).forEach(function (entity) {
    let attackResult = from.character.damage(from, entity, attack);

    if (attackResult.finalTarget.character.healthBar <= 0) {
      if (attackResult.finalTarget === world.player) {
        console.log('Player dead.');
      } else {
        processEntityDeath(attackResult.finalTarget, from, world);
      }
    }
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
  attacker: Entity,
  attack: Attack,
  lookDir: LookDirection,
  pos: Point2d,
  world: World,
  enemy?: Entity
): { success: boolean; attackedTiles: Point2d[] } {
  if (!enemy) return { success: false, attackedTiles: [] };

  const { x: width, y: height } = getGridSize(attack.areaSize, lookDir);
  const offset = getOffsetsByPos(lookDir, attack);
  const mask = attack.area[lookDir];
  if (!inBounds(mask, pos, { x: enemy.x, y: enemy.y }, offset)) {
    return { success: false, attackedTiles: [] };
  }

  const attackResult = attacker.character.damage(attacker, enemy, attack);
  const room = world.map.rooms[world.map.currentRoom];

  if (attackResult.finalTarget.character.healthBar <= 0) {
    if (attackResult.finalTarget === world.player) {
      console.log('Player dead.');
    } else {
      processEntityDeath(attackResult.finalTarget, attacker, world);
    }
  }

  const map = room.map;
  const attackedTiles: Point2d[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x] !== 1) continue;

      const targetX = pos.x + x - offset.x;
      const targetY = pos.y + y - offset.y;

      if (
        targetY >= 0 &&
        targetY < map.length &&
        targetX >= 0 &&
        targetX < map[0].length
      ) {
        const tile = map[targetY][targetX];
        if (tile === 'floor') {
          attackedTiles.push({
            x: targetX,
            y: targetY,
          });
        }
      }
    }
  }
  return { success: true, attackedTiles: attackedTiles };
}

function attackAll(
  attacker: Entity,
  attack: Attack,
  lookDir: LookDirection,
  pos: Point2d,
  world: World
): { success: boolean; attackedTiles: Point2d[] } {
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
        targetY >= 0 &&
        targetY < map.length &&
        targetX >= 0 &&
        targetX < map[0].length
      ) {
        const tile = map[targetY][targetX];
        const pos: Point2d = { x: targetX, y: targetY };

        if (room.entities.get(pos)) {
          processAttack(room, attacker, attack, pos, world);
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
    attackedTiles: attackedTiles,
  };
}

interface AttackResult {
  success: boolean;
  attackedTiles: Point2d[];
  lastAttacked: number;
}

export type MovementResult = {
  to: Point2d;
  lookDir?: LookDirection;
  attackResult?: AttackResult;
  lastAttacked: number;
  lastMoved: number;
};

export interface Strategy {
  move: (context: Entity, world: World) => MovementResult;
  attack: (
    context: Entity,
    world: World,
    attack: Attack,
    enemy?: Entity
  ) => AttackResult;
}

export class PlayerStrategy implements Strategy {
  public attack(context: Entity, world: World, attack: Attack): AttackResult {
    const { x, y, lookDir, character, animation } = context;
    const lastAttacked = animation.lastAttacked;
    const from = { x: x, y: y };
    if (Date.now() - lastAttacked < character.getAttackSpeed(attack)) {
      return {
        success: false,
        attackedTiles: [],
        lastAttacked: lastAttacked,
      };
    }
    return {
      ...attackAll(context, attack, lookDir, from, world),
      lastAttacked: Date.now(),
    };
  }
  public move(context: Entity, world: World): MovementResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    const { lastAttacked, lastMoved } = animation;
    let pos = neutralMovement(context, world);
    return { ...pos, lastAttacked: lastAttacked, lastMoved: lastMoved };
  }
}

export class Aggresive implements Strategy {
  public attack(
    context: Entity,
    world: World,
    attack: Attack,
    enemy?: Entity
  ): AttackResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    const { lastAttacked, lastMoved } = animation;
    if (Date.now() - lastAttacked < character.getAttackSpeed(attack)) {
      return {
        success: false,
        attackedTiles: [],
        lastAttacked: lastAttacked,
      };
    }
    return {
      ...attackOneEntity(context, attack, lookDir, from, world, enemy),
      lastAttacked: Date.now(),
    };
  }
  public move(context: Entity, world: World): MovementResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    let { lastAttacked, lastMoved } = animation;
    let pos = aggressiveMovement(context, world);
    if (!pos.lookDir) pos.lookDir = lookDir;

    if (Date.now() - lastMoved < character.getSpeed()) {
      pos.to = from;
    } else {
      lastMoved = Date.now();
    }
    for (const attack of character.attacks) {
      let attackResult = this.attack(context, world, attack, world.player);
      if (attackResult.success) {
        return {
          ...pos,
          attackResult: attackResult,
          lastAttacked: attackResult.lastAttacked,
          lastMoved: lastMoved,
        };
      }
    }
    return { ...pos, lastAttacked: lastAttacked, lastMoved: lastMoved };
  }
}

export class Neutral implements Strategy {
  public attack(context: Entity, world: World, attack: Attack): AttackResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    const { lastAttacked, lastMoved } = animation;
    return { success: false, attackedTiles: [], lastAttacked: lastAttacked };
  }
  public move(context: Entity, world: World): MovementResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    let { lastAttacked, lastMoved } = animation;
    let pos = neutralMovement(context, world);
    if (Date.now() - lastMoved < character.getSpeed()) {
      pos.to = from;
    } else {
      lastMoved = Date.now();
    }
    return { ...pos, lastAttacked: lastAttacked, lastMoved: lastMoved };
  }
}

export class Coward implements Strategy {
  public attack(context: Entity, world: World, attack: Attack): AttackResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    const { lastAttacked, lastMoved } = animation;
    return { success: false, attackedTiles: [], lastAttacked: lastAttacked };
  }
  public move(context: Entity, world: World): MovementResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    let { lastAttacked, lastMoved } = animation;
    let pos = cowardMovement(context, world);
    if (Date.now() - lastMoved < character.getSpeed()) {
      pos.to = from;
    } else {
      lastMoved = Date.now();
    }
    return { ...pos, lastAttacked: lastAttacked, lastMoved: lastMoved };
  }
}

export class Fury implements Strategy {
  public attack(context: Entity, world: World, attack: Attack): AttackResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    let { lastAttacked, lastMoved } = animation;
    if (Date.now() - lastAttacked < character.getAttackSpeed(attack)) {
      return {
        success: false,
        attackedTiles: [],
        lastAttacked: lastAttacked,
      };
    }
    return {
      ...attackAll(context, attack, lookDir, from, world),
      lastAttacked: Date.now(),
    };
  }
  public move(context: Entity, world: World): MovementResult {
    const { x, y, lookDir, character, animation } = context;
    const from = { x: x, y: y };
    let { lastAttacked, lastMoved } = animation;
    let pos = neutralMovement(context, world);
    if (!pos.lookDir) pos.lookDir = lookDir;
    if (Date.now() - lastMoved < character.getSpeed()) {
      pos.to = from;
    } else {
      lastMoved = Date.now();
    }

    const attackChosen = Math.floor(Math.random() * character.attacks.length);
    const attack = character.attacks[attackChosen];
    let attackResult = this.attack(context, world, attack);
    return {
      ...pos,
      lastAttacked: attackResult.lastAttacked,
      lastMoved: lastMoved,
      attackResult: attackResult,
    };
  }
}

export const strategyMap: Record<string, Strategy> = {
  Neutral: new Neutral(),
  Coward: new Coward(),
  Aggresive: new Aggresive(),
  Fury: new Fury(),
};
