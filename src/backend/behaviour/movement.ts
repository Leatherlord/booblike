import { Entity, getGridSize, getOffsetsByPos, LookDirection, Point2d, Room, Size, World } from "../../common/interfaces";

function checkIfValidMove(room: Room, newX: number, newY: number) {
    return (
        newY >= 0 && 
        newY < room.map.length && 
        newX >= 0 && newX < room.map[0].length && 
        room.map[newY][newX] === 'floor'
    );
}

function inBounds(
    mask: Point2d, 
    pos: Point2d, 
    enemy: Point2d,
    offset: Point2d
): boolean {
    const dy = enemy.y - (pos.y - offset.y);
    const dx = enemy.x - (pos.x - offset.x);
    return !(dy < 0 || dy >= mask.y || dx < 0 || dx >= mask.x);
}

function isValidPosition(room: Room, pos: Point2d): boolean {
    return (
        pos.y >= 0 && pos.y < room.map.length &&
        pos.x >= 0 && pos.x < room.map[0].length &&
        room.map[pos.y][pos.x] === 'floor'
    );
}

function manhattanDistance(a: Point2d, b: Point2d): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}


function shiftToDirection(shift: number[]): LookDirection {
    if (shift[0] === 1) return LookDirection.Right;
    if (shift[0] === -1) return LookDirection.Left;
    if (shift[1] === 1) return LookDirection.Down;
    if (shift[1] === -1) return LookDirection.Up;
    return LookDirection.Down;
}

function calculateLookDirectionAggression(creaturePos: Point2d, playerPos: Point2d): LookDirection {
    const dx = playerPos.x - creaturePos.x;
    const dy = playerPos.y - creaturePos.y;
    
    if (dx === 0 && dy === 0) return LookDirection.Down;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? LookDirection.Right : LookDirection.Left;
    }
    return dy > 0 ? LookDirection.Down : LookDirection.Up;
}

function hasLineOfSight(room: Room, start: Point2d, end: Point2d): boolean {
    if (start.x === end.x && start.y === end.y) return true;
    
    let x0 = start.x;
    let y0 = start.y;
    const x1 = end.x;
    const y1 = end.y;
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    
    while (true) {
        if (x0 === x1 && y0 === y1) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
        
        if (x0 === x1 && y0 === y1) break;
        
        if (room.map[y0]?.[x0] !== 'floor') {
            return false;
        }
    }
    
    return true;
}


function calculateLookDirectionCoward(creaturePos: Point2d, playerPos: Point2d): LookDirection {
    const dx = playerPos.x - creaturePos.x;
    const dy = playerPos.y - creaturePos.y;
    
    if (dx === 0 && dy === 0) return LookDirection.Down;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? LookDirection.Left : LookDirection.Right;
    }
    return dy > 0 ? LookDirection.Up : LookDirection.Down;
}

export function neutralMovement(context: Entity, world: World) : { to: Point2d, lookDir?: LookDirection } {
    const {animation, lookDir, x, y} = context;
    const from = {x: x, y: y}
    const room = world.map.rooms[world.map.currentRoom];
    const availableShift = [[-1, 1], [1, -1], [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1]];
    const shiftIndex = Math.floor(Math.random() * availableShift.length);
    const movementShift = availableShift[shiftIndex];
    const lookDirect = shiftToDirection(movementShift);

    const newX = from.x + movementShift[0];
    const newY = from.y + movementShift[1];

    if ((checkIfValidMove(room, newX, newY) 
        || (newX === world.player.x && newY === world.player.y))
        && !(room.entities.get({x: newX, y: newY}))
    ) {
        return { to: { x: newX, y: newY }, lookDir: lookDirect };
    }

    return { to: {x: from.x, y: from.y}, lookDir: lookDirect };
}

export function aggressiveMovement(context: Entity, world: World) : { to: Point2d, lookDir?: LookDirection } {
    const {animation, lookDir, x, y, character} = context;
    const from = {x: x, y: y}
    const room = world.map.rooms[world.map.currentRoom];
    const offset = getOffsetsByPos(lookDir, character);
    const enemyPos = { x : world.player.x, y : world.player.y };
    //|| !hasLineOfSight(room, from, enemyPos)
    if (!inBounds(getGridSize(character.areaSize, lookDir), from, enemyPos, offset)) {
        return neutralMovement(context, world);
    }
    const availableShift = [[-1, 1], [1, -1], [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1]];
    let bestDist = manhattanDistance(from, enemyPos);
    let bestShift: [number, number] = [0, 0];
    for (const [dx, dy] of availableShift) {
        const target = { x: from.x + dx, y: from.y + dy };
        if (target.x === enemyPos.x && target.y === enemyPos.y) {
            continue;
        }
        if (room.entities.get(target)) {
            continue;
        }
        if (!isValidPosition(room, target)) continue;
        const newDist = manhattanDistance(target, enemyPos);
        if (newDist < bestDist) {
            bestDist = newDist;
            bestShift = [dx, dy];
        }
    }
    
    let newPos = {x: from.x + bestShift[0], y: from.y + bestShift[1]};
    const finalLookDir = calculateLookDirectionAggression(
        bestShift[0] !== 0 || bestShift[1] !== 0 ? newPos : from, 
        enemyPos
    );
    return { to: newPos, lookDir: finalLookDir };
}

export function cowardMovement(context: Entity, world: World): { to: Point2d, lookDir?: LookDirection } {
    const {animation, lookDir, x, y, character} = context;
    const from = {x: x, y: y}
    const room = world.map.rooms[world.map.currentRoom];
    const enemyPos = { x: world.player.x, y: world.player.y };
    let dir: LookDirection;
    switch(lookDir) {
        case LookDirection.Up: {
            dir = LookDirection.Up;
            break;
        }
        case LookDirection.Down: {
            dir = LookDirection.Down;
            break;
        }
        case LookDirection.Left: {
            dir = LookDirection.Left;
            break;
        }
        case LookDirection.Right: {
            dir = LookDirection.Right;
            break;
        }
    }
    const offset = getOffsetsByPos(dir, character);
    if (!inBounds(getGridSize(character.areaSize, dir), from, enemyPos, offset)) {
        return neutralMovement(context, world);
    }

    const availableShift = [[-1, 1], [1, -1], [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1]];
    
    let bestDist = manhattanDistance(from, enemyPos);
    let bestShift: [number, number] = [0, 0];
    for (const [dx, dy] of availableShift) {
        const target = { x: from.x + dx, y: from.y + dy };
        if (target.x === enemyPos.x && target.y === enemyPos.y) {
            continue;
        }
        if (!isValidPosition(room, target)) continue;
        const newDist = manhattanDistance(target, enemyPos);
        if (newDist > bestDist) {
            bestDist = newDist;
            bestShift = [dx, dy];
        }
    }
    const newPos = {
        x: from.x + bestShift[0],
        y: from.y + bestShift[1]
    };
    const finalLookDir = calculateLookDirectionCoward(from, enemyPos);
    
    return { to: newPos, lookDir: finalLookDir };
}