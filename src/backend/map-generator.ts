import { Point2d, Room, Tile } from "../common/interfaces";
import { prngAlea } from 'ts-seedrandom';
import * as Collections from 'typescript-collections';

const MAX_ROOM_SIZE = 50;
const MIN_ROOM_SIZE = 20;
const MIN_DOOR_NUM = 1;
const MAX_DOOR_NUM = 5;
const SMOOTHING_STEPS = 7;
const WALL_INNITIAL_PROBABILITY = 0.48;
const LEAST_WALL_ISLAND_SIZE = 16;

const OFFSETS_2D = [
    {x: 0, y: 1}, {x: 0, y: -1},
    {x: 1, y: 0}, {x: -1, y: 0},
    {x: 1, y: 1}, {x: -1, y: 1},
    {x: 1, y: -1}, {x: -1, y: -1},
];

const WALKABLE_OFFSETS_2D = [
    {x: 0, y: 1}, {x: 0, y: -1},
    {x: 1, y: 0}, {x: -1, y: 0},
];

function countNeighbouring(sample: Point2d, map: Tile[][], type: Tile): number {
    let cnt = 0;
    for (const o of OFFSETS_2D) {
        if (sample.x + o.x < 0 || sample.x + o.x >= map.length) {continue};
        if (sample.y + o.y < 0 || sample.y + o.y >= map[0].length) {continue};
        if (map[sample.x + o.x][sample.y + o.y] == type) {
            cnt += 1;
        }
    }
    return cnt;
}

function countWalkableNeighbouring(sample: Point2d, map: Tile[][], type: Tile): number {
    let cnt = 0;
    for (const o of WALKABLE_OFFSETS_2D) {
        if (sample.x + o.x < 0 || sample.x + o.x >= map.length) {continue};
        if (sample.y + o.y < 0 || sample.y + o.y >= map[0].length) {continue};
        if (map[sample.x + o.x][sample.y + o.y] == type) {
            cnt += 1;
        }
    }
    return cnt;
}

function flood(start: Point2d, map: Tile[][], modifier: (t: Tile) => Tile = (t => t)): number {
    let cnt = 0;
    type mark = 'empty' | 'queued' | 'visited';
    let marks: mark[][] = map.map(r => r.map(() => 'empty'));
    let q: Collections.Queue<Point2d> = new Collections.Queue();
    q.add(start);
    marks[start.x][start.y] = 'queued';
    while (!q.isEmpty()) {
        const p = q.dequeue();
        if (p == undefined) {break;}
        marks[p.x][p.y] = 'visited';
        for (const o of WALKABLE_OFFSETS_2D) {
            const nx = p.x + o.x;
            const ny = p.y + o.y; 
            if (nx < 0 || nx >= map.length) {continue};
            if (ny < 0 || ny >= map[0].length) {continue};
            if (marks[nx][ny] == 'empty' && map[p.x][p.y] == map[nx][ny]) {
                q.add({x: nx, y: ny});
                marks[nx][ny] = 'queued';
            }
        }
        map[p.x][p.y] = modifier(map[p.x][p.y]);
        cnt += 1;
    }
    return cnt;
}

function getBorder(map: Tile[][], byWalkable: boolean = true): Point2d[] {
    const roomSize = map.length;
    let borderStart: Point2d | undefined = undefined;
    const neighboursFunction = byWalkable ? countWalkableNeighbouring : countNeighbouring;
    const maxNeighbours = byWalkable ? 4 : 8;
    for (let i = 0; i < roomSize - 1; ++i) {
        for (let j = 0; j < roomSize - 1; ++j) {
            if (map[i][j] != 'wall') {continue;}
            const floorsNumber = neighboursFunction({x: i, y: j}, map, 'floor');
            if (floorsNumber < maxNeighbours && floorsNumber > 0) {
                borderStart = {x: i, y: j};
                break;
            }
        }
        if (borderStart != undefined) {
            break;
        }
    }
    type mark = 'empty' | 'queued' | 'visited';
    let marks: mark[][] = map.map(r => r.map(() => 'empty'));
    let q: Collections.Queue<Point2d> = new Collections.Queue();
    q.add(borderStart!);
    marks[borderStart!.x][borderStart!.y] = 'queued';
    let border: Point2d[] = [];
    while(!q.isEmpty()) {
        const p = q.dequeue();
        if (p == undefined) {break;}
        marks[p.x][p.y] = 'visited';
        border.push({x: p.x, y: p.y});
        for (const o of OFFSETS_2D) {
            const nx = p.x + o.x;
            const ny = p.y + o.y; 
            if (nx < 0 || nx >= map.length) {continue};
            if (ny < 0 || ny >= map[0].length) {continue};
            const floorsNumber = neighboursFunction({x: nx, y: ny}, map, 'floor');
            if (marks[nx][ny] == 'empty' &&
                map[p.x][p.y] == map[nx][ny] && 
                floorsNumber > 0 &&
                floorsNumber < maxNeighbours) {
                    q.add({x: nx, y: ny});
                    marks[nx][ny] = 'queued';
            }
        }
    }
    return border;
}

function generateDungeonMap(seed: number): Tile[][]{
    const rng = prngAlea(seed);
    const roomSize = Math.round(MIN_ROOM_SIZE + rng.quick() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE));

    // Initial generation
    let basicBox: Tile[][] = Array(roomSize)
      .fill(null)
      .map(() =>
        Array(roomSize)
        .fill(0).map(() => {
           const r = rng.quick();
           if (r > (1 - WALL_INNITIAL_PROBABILITY)) {
            return "wall"
           }
           return "floor";
        }));
    
    // Adding walls
    for (let i = 0; i < roomSize; ++i) {
        basicBox[0][i] = "wall";
        basicBox[roomSize - 1][i] = "wall";
        basicBox[i][0] = "wall";
        basicBox[i][roomSize - 1] = "wall";
        basicBox[1][i] = "wall";
        basicBox[roomSize - 2][i] = "wall";
        basicBox[i][1] = "wall";
        basicBox[i][roomSize - 2] = "wall";
    }
    
    // Smoothening
    let smoothedBox = null;
    for (let k = 0; k < SMOOTHING_STEPS; ++k) {
        smoothedBox = basicBox.map(row => [...row]);
        for (let i = 1; i < roomSize - 1; ++i) {
            for (let j = 1; j < roomSize - 1; ++j) {
                const wallNeighbours = countNeighbouring({x: i, y: j}, basicBox, 'wall');
                if (basicBox[i][j] == "floor" && wallNeighbours >= 5) {
                    smoothedBox[i][j] = "wall";
                }
                if (basicBox[i][j] == "wall" && (wallNeighbours < 4 || wallNeighbours > 8)) {
                    smoothedBox[i][j] = "floor";
                }
            }
        }
        basicBox = smoothedBox.map(row => [...row]);
    }

    // Removing unreachable
    let starts: Point2d[] = [];
    let maxCnt = 0;
    let maxCntStart: Point2d | undefined = undefined;
    for (let i = 1; i < roomSize - 1; ++i) {
        for (let j = 1; j < roomSize - 1; ++j) {
            if (smoothedBox![i][j] == 'floor') {
                const start = {x: i, y: j};
                const cnt = flood(start, smoothedBox!, _ => 'wall');
                starts.push(start);
                if (cnt > maxCnt) {
                    maxCntStart = start;
                    maxCnt = cnt;
                }
            }
        }
    }
    for (let s of starts) {
        if (s.x == maxCntStart!.x && s.y == maxCntStart!.y) {
            continue;
        }
        flood(s, basicBox, _ => 'wall');
    }

    // removing extra walls
    const mapBorder = getBorder(basicBox, false);
    flood({x: 0, y: 0}, basicBox, _ => 'empty');
    for (const p of mapBorder) {
        basicBox[p.x][p.y] = 'wall';
    }
    flood({x: 0, y: 0}, basicBox, _ => 'door');
    for (let i = 1; i < roomSize - 1; ++i) {
        for (let j = 1; j < roomSize - 1; ++j) {
            if (basicBox[i][j] == 'empty') {
                flood({x: i, y:j}, basicBox, _ => 'wall');
            }
            if (basicBox[i][j] == 'wall') {
                const size = flood({x: i, y:j}, basicBox);
                if (size < LEAST_WALL_ISLAND_SIZE) {
                    flood({x: i, y:j}, basicBox, _ => 'floor');
                }
            }
        }
    }
    flood({x: 0, y: 0}, basicBox, _ => 'empty');
    return basicBox;
}

export function generateRoom(seed: number): Room {
    console.log("generating map with seed: ", seed);
    const rng = prngAlea(seed);
    let map = generateDungeonMap(seed);
    const border = getBorder(map);
    const doorNum = MIN_DOOR_NUM + Math.round(rng() * (MAX_DOOR_NUM - MIN_DOOR_NUM));
    let exitMap = new Map<Point2d, number>();
    let prevExitId = 0;
    function okForExit(id: number): boolean {
        const p = border[id];
        if ((p.x < 2 || p.x > map.length - 2) && (p.y < 2 || p.y > map.length - 2)) {
            return false;
        }
        return (map[p.x - 1][p.y] == 'wall' && map[p.x + 1][p.y] == 'wall') ||
               (map[p.x][p.y - 1] == 'wall' && map[p.x][p.y + 1] == 'wall');
    }
    for (let i = 0; i < doorNum; ++i) {
        let exitId = (prevExitId + Math.round(rng() * border.length / doorNum)) % border.length;
        while (!okForExit(exitId)) {
            exitId = (exitId + 1) % border.length;
        }
        prevExitId = exitId;
        const p = border[exitId];
        map[p.x][p.y] = 'door';
        exitMap.set(border[exitId], i);
    }
    return {map: map, exits: exitMap};
}
