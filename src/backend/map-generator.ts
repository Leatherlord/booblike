import { Point2d, Tile } from "../common/interfaces";
import { prngAlea } from 'ts-seedrandom';
import * as Collections from 'typescript-collections';

const MAX_ROOM_SIZE = 80;
const MIN_ROOM_SIZE = 20;
const SMOOTHING_STEPS = 7;
const WALL_INNITIAL_PROBABILITY = 0.48;

const OFFSETS_2D = [
    {x: 0, y: 1}, {x: 0, y: -1},
    {x: 1, y: 0}, {x: -1, y: 0},
    {x: 1, y: 1}, {x: -1, y: 1},
    {x: 1, y: -1}, {x: -1, y: -1},
];

function countWalls(sample: Point2d, map: Tile[][]): number {
    
    let cnt = 0;
    for (const o of OFFSETS_2D) {
        if (sample.x + o.x < 0 || sample.x + o.x >= map.length) {continue};
        if (sample.y + o.y < 0 || sample.y + o.y >= map[0].length) {continue};
        if (map[sample.x + o.x][sample.y + o.y] == 'wall') {
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
        for (const o of OFFSETS_2D) {
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

export function generateDungeonMap(seed: number): Tile[][]{
    const rng = prngAlea(seed);
    const roomSize = Math.round(MIN_ROOM_SIZE + rng.quick() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE));

    // Initial generation
    let basicBox = Array(roomSize)
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
    }
    
    // Smoothening
    let smoothedBox = null;
    for (let k = 0; k < SMOOTHING_STEPS; ++k) {
        smoothedBox = basicBox.map(row => [...row]);
        for (let i = 1; i < roomSize - 1; ++i) {
            for (let j = 1; j < roomSize - 1; ++j) {
                const wallNeighbours = countWalls({x: i, y: j}, basicBox);
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
                console.log(cnt);
                console.log(start);
                starts.push(start);
                if (cnt > maxCnt) {
                    maxCntStart = start;
                    maxCnt = cnt;
                }
            }
        }
    }
    console.log(maxCntStart);
    for (let s of starts) {
        console.log(s);
        if (s.x == maxCntStart!.x && s.y == maxCntStart!.y) {
            continue;
        }
        flood(s, basicBox, _ => 'wall');
    }
    return basicBox;
}