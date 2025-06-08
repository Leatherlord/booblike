import { LookDirection, Point2d, Room, World } from "../../common/interfaces";

function checkIfValidMove(room: Room, newX: number, newY: number) {
    return (
        newY >= 0 && 
        newY < room.map.length && 
        newX >= 0 && newX < room.map[0].length && 
        room.map[newY][newX] === 'floor' &&
        !room.entities.get({x: newX, y: newY})
    );
}

export function neutralMovement(from: Point2d, world: World) : { to: Point2d, lookDir?: LookDirection } {
    const availableShift = [-1, 0, 1];
    const room = world.map.rooms[world.map.currentRoom];

    const shiftIndex = Math.floor(Math.random() * availableShift.length);
    const shiftValue = availableShift[shiftIndex];

    const coordChosen = Math.floor(Math.random() * 2);
    const movementShift = coordChosen === 0
        ? { x: shiftValue, y: 0 }
        : { x: 0, y: shiftValue };

    let lookDirect: LookDirection;
    switch (`${coordChosen}-${shiftValue}`) {
        case '0-1':
            lookDirect = LookDirection.Left
            break;
        case '0--1':
            lookDirect = LookDirection.Right
            break;
        case '1-1':
            lookDirect = LookDirection.Up
            break;
        case '1--1':
            lookDirect = LookDirection.Down
            break;
        default:
            return { to: {x: from.x, y: from.y} };
    }

    const newX = from.x + movementShift.x;
    const newY = from.y + movementShift.y;

    if (checkIfValidMove(room, newX, newY)) {
        return { to: { x: newX, y: newY }, lookDir: lookDirect };
    }

    return { to: {x: from.x, y: from.y}, lookDir: lookDirect};
}

export function aggressiveMovement(from: Point2d, world: World) : { to: Point2d, lookDir?: LookDirection } {
    return { to: {x: from.x, y: from.y} };
}


// line of sight

//Dijkstra’s Algorithm
function getPathToPlayer(room: Room) {

}