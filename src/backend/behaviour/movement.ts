import { Point2d, Room, World } from "../../common/interfaces";

export interface MovementResult{
    to: Point2d
}

function checkIfValidMove(room: Room, newX: number, newY: number) {
    return (
        newY >= 0 && 
        newY < room.map.length && 
        newX >= 0 && newX < room.map[0].length && 
        room.map[newY][newX] === 'floor' &&
        !room.entities.get({x: newX, y: newY})
    );
}

export function neutralMovement(from: Point2d, world: World): MovementResult {
    const availableShift = [-1, 0, 1];
    const room = world.map.rooms[world.map.currentRoom];

    const shiftIndex = Math.floor(Math.random() * availableShift.length);
    const shiftValue = availableShift[shiftIndex];

    const coordChosen = Math.floor(Math.random() * 2);
    const movementShift = coordChosen === 0
        ? { x: shiftValue, y: 0 }
        : { x: 0, y: shiftValue };

    const newX = from.x + movementShift.x;
    const newY = from.y + movementShift.y;

    if (checkIfValidMove(room, newX, newY)) {
        return { to: { x: newX, y: newY } };
    }

    return { to: { x: from.x, y: from.y } };
}


// line of sight

//Dijkstra’s Algorithm
function getPathToPlayer(room: Room) {

}