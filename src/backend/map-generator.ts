import { EntitiesMap, Entity, LookDirection, Point2d, Room, Tile } from "../common/interfaces";
import { prngAlea } from 'ts-seedrandom';
import * as Collections from 'typescript-collections';
import { DummyCharacter } from "./behaviour/character";
import { Aggresive, Coward, Neutral } from "./behaviour/state";
import { WeaklingClass } from "./behaviour/classes";

const MAX_ROOM_SIZE = 50;
const MIN_ROOM_SIZE = 20;
const SMOOTHING_STEPS = 7;
const WALL_INNITIAL_PROBABILITY = 0.48;
const LEAST_WALL_ISLAND_SIZE = 16;
const STARTING_ROOM_SIZE = 21;

const OFFSETS_2D = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: -1 },
];

const WALKABLE_OFFSETS_2D = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
];

function countNeighbouring(sample: Point2d, map: Tile[][], type: Tile): number {
  let cnt = 0;
  for (const o of OFFSETS_2D) {
    if (sample.x + o.x < 0 || sample.x + o.x >= map.length) {
      continue;
    }
    if (sample.y + o.y < 0 || sample.y + o.y >= map[0].length) {
      continue;
    }
    if (map[sample.y + o.y][sample.x + o.x] == type) {
      cnt += 1;
    }
  }
  return cnt;
}

function countWalkableNeighbouring(
  sample: Point2d,
  map: Tile[][],
  type: Tile
): number {
  let cnt = 0;
  for (const o of WALKABLE_OFFSETS_2D) {
    if (sample.x + o.x < 0 || sample.x + o.x >= map.length) {
      continue;
    }
    if (sample.y + o.y < 0 || sample.y + o.y >= map[0].length) {
      continue;
    }
    if (map[sample.y + o.y][sample.x + o.x] == type) {
      cnt += 1;
    }
  }
  return cnt;
}

function flood(
  start: Point2d,
  map: Tile[][],
  modifier: (t: Tile) => Tile = (t) => t
): number {
  let cnt = 0;
  type mark = 'empty' | 'queued' | 'visited';
  let marks: mark[][] = map.map((r) => r.map(() => 'empty'));
  let q: Collections.Queue<Point2d> = new Collections.Queue();
  q.add(start);
  marks[start.y][start.x] = 'queued';
  while (!q.isEmpty()) {
    const p = q.dequeue();
    if (p === undefined) {
      break;
    }
    marks[p.y][p.x] = 'visited';
    for (const o of WALKABLE_OFFSETS_2D) {
      const nx = p.x + o.x;
      const ny = p.y + o.y;
      if (nx < 0 || nx >= map.length) {
        continue;
      }
      if (ny < 0 || ny >= map[0].length) {
        continue;
      }
      if (marks[ny][nx] == 'empty' && map[p.y][p.x] == map[ny][nx]) {
        q.add({ x: nx, y: ny });
        marks[ny][nx] = 'queued';
      }
    }
    map[p.y][p.x] = modifier(map[p.y][p.x]);
    cnt += 1;
  }
  return cnt;
}

function getBorder(map: Tile[][], byWalkable: boolean = true): Point2d[] {
  const roomSize = map.length;
  let borderStart: Point2d | undefined = undefined;
  const neighboursFunction = byWalkable
    ? countWalkableNeighbouring
    : countNeighbouring;
  const maxNeighbours = byWalkable ? 4 : 8;
  for (let i = 0; i < roomSize - 1; ++i) {
    for (let j = 0; j < roomSize - 1; ++j) {
      if (map[j][i] != 'wall') {
        continue;
      }
      const floorsNumber = neighboursFunction({ x: i, y: j }, map, 'floor');
      if (floorsNumber < maxNeighbours && floorsNumber > 0) {
        borderStart = { x: i, y: j };
        break;
      }
    }
    if (borderStart != undefined) {
      break;
    }
  }
  type mark = 'empty' | 'queued' | 'visited';
  let marks: mark[][] = map.map((r) => r.map(() => 'empty'));
  let q: Collections.Queue<Point2d> = new Collections.Queue();
  q.add(borderStart!);
  marks[borderStart!.y][borderStart!.x] = 'queued';
  let border: Point2d[] = [];
  while (!q.isEmpty()) {
    const p = q.dequeue();
    if (p === undefined) {
      break;
    }
    marks[p.y][p.x] = 'visited';
    border.push({ x: p.x, y: p.y });
    for (const o of OFFSETS_2D) {
      const nx = p.x + o.x;
      const ny = p.y + o.y;
      if (nx < 0 || nx >= map.length) {
        continue;
      }
      if (ny < 0 || ny >= map[0].length) {
        continue;
      }
      const floorsNumber = neighboursFunction({ x: nx, y: ny }, map, 'floor');
      if (
        marks[ny][nx] == 'empty' &&
        map[p.y][p.x] == map[ny][nx] &&
        floorsNumber > 0 &&
        floorsNumber < maxNeighbours
      ) {
        q.add({ x: nx, y: ny });
        marks[ny][nx] = 'queued';
      }
    }
  }
  return border;
}

function generateDungeonMap(seed: number): Tile[][] {
  const rng = prngAlea(seed);
  const roomSize = Math.round(
    MIN_ROOM_SIZE + rng.quick() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE)
  );

  // Initial generation
  let basicBox: Tile[][] = Array(roomSize)
    .fill(null)
    .map(() =>
      Array(roomSize)
        .fill(0)
        .map(() => {
          const r = rng.quick();
          if (r > 1 - WALL_INNITIAL_PROBABILITY) {
            return 'wall';
          }
          return 'floor';
        })
    );

  // Adding walls
  for (let i = 0; i < roomSize; ++i) {
    basicBox[0][i] = 'wall';
    basicBox[roomSize - 1][i] = 'wall';
    basicBox[i][0] = 'wall';
    basicBox[i][roomSize - 1] = 'wall';
    basicBox[1][i] = 'wall';
    basicBox[roomSize - 2][i] = 'wall';
    basicBox[i][1] = 'wall';
    basicBox[i][roomSize - 2] = 'wall';
  }

  // Smoothening
  let smoothedBox = null;
  for (let k = 0; k < SMOOTHING_STEPS; ++k) {
    smoothedBox = basicBox.map((row) => [...row]);
    for (let i = 2; i < roomSize - 2; ++i) {
      for (let j = 2; j < roomSize - 2; ++j) {
        const wallNeighbours = countNeighbouring(
          { x: i, y: j },
          basicBox,
          'wall'
        );
        if (basicBox[j][i] == 'floor' && wallNeighbours >= 5) {
          smoothedBox[j][i] = 'wall';
        }
        if (
          basicBox[j][i] == 'wall' &&
          (wallNeighbours < 4 || wallNeighbours > 8)
        ) {
          smoothedBox[j][i] = 'floor';
        }
      }
    }
    basicBox = smoothedBox.map((row) => [...row]);
  }

  // Removing unreachable
  let starts: Point2d[] = [];
  let maxCnt = 0;
  let maxCntStart: Point2d | undefined = undefined;
  for (let i = 1; i < roomSize - 1; ++i) {
    for (let j = 1; j < roomSize - 1; ++j) {
      if (smoothedBox![j][i] == 'floor') {
        const start = { x: i, y: j };
        const cnt = flood(start, smoothedBox!, (_) => 'wall');
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
    flood(s, basicBox, (_) => 'wall');
  }

  // removing extra walls
  const mapBorder = getBorder(basicBox, false);
  flood({ x: 0, y: 0 }, basicBox, (_) => 'empty');
  for (const p of mapBorder) {
    basicBox[p.y][p.x] = 'wall';
  }
  flood({ x: 0, y: 0 }, basicBox, (_) => 'door');
  for (let i = 1; i < roomSize - 1; ++i) {
    for (let j = 1; j < roomSize - 1; ++j) {
      if (basicBox[j][i] == 'empty') {
        flood({ x: i, y: j }, basicBox, (_) => 'wall');
      }
      if (basicBox[j][i] == 'wall') {
        const size = flood({ x: i, y: j }, basicBox);
        if (size < LEAST_WALL_ISLAND_SIZE) {
          flood({ x: i, y: j }, basicBox, (_) => 'floor');
        }
      }
    }
  }
  flood({ x: 0, y: 0 }, basicBox, (_) => 'empty');
  return basicBox;
}

export function generateRoom(
  seed: number,
  level: number = 0,
  twoDoorsRequired: boolean = false
): Room {
  console.log('generating map with seed: ', seed);
  const rng = prngAlea(seed);
  let map = generateDungeonMap(seed);
  const mapSize = map.length;
  const border = getBorder(map);
  const minDoorsNum = twoDoorsRequired ? 2 : 1;
  const maxDoorsNum = Math.round(mapSize / 12);
  const doorNum = minDoorsNum + Math.round(rng() * (maxDoorsNum - minDoorsNum));
  let exitMap = new Collections.Dictionary<Point2d, number>(JSON.stringify);
  let reverseExitMap = new Collections.Dictionary<number, Point2d>();
  let prevExitId = 0;
  function okForExit(id: number): boolean {
    const p = border[id];
    if (
      (p.x < 2 || p.x > map.length - 2) &&
      (p.y < 2 || p.y > map.length - 2)
    ) {
      return false;
    }
    return (
      (map[p.y - 1][p.x] == 'wall' && map[p.y + 1][p.x] == 'wall') ||
      (map[p.y][p.x - 1] == 'wall' && map[p.y][p.x + 1] == 'wall')
    );
  }
  for (let i = 0; i < doorNum; ++i) {
    let exitId =
      (prevExitId + Math.round((rng() * border.length) / doorNum)) %
      border.length;
    while (!okForExit(exitId)) {
      exitId = (exitId + 1) % border.length;
    }
    return {map: map, exits: exitMap, reverseExits: reverseExitMap, entities: new EntitiesMap()};
}

export function getStartingRoom(): Room {
    let map: Tile[][] = Array(STARTING_ROOM_SIZE)
      .fill(null)
      .map(() =>
        Array(STARTING_ROOM_SIZE)
          .fill(null)
          .map((_, colIndex) => {
            if (colIndex === 0 || colIndex === STARTING_ROOM_SIZE - 1) return 'wall';
            return 'floor';
          })
      )
      .map((row, rowIndex) => {
        if (rowIndex === 0 || rowIndex === STARTING_ROOM_SIZE - 1) {
          return Array(STARTING_ROOM_SIZE).fill('wall');
        }
        return row;
      });
    const doorPos: Point2d = {
        x: Math.trunc(STARTING_ROOM_SIZE / 2),
        y: 0
    };
    map[doorPos.y][doorPos.x] = 'door';
    let exits: Collections.Dictionary<Point2d, number> = new Collections.Dictionary(JSON.stringify);
    exits.setValue(doorPos, 0);
    let reverseExits: Collections.Dictionary<number, Point2d> = new Collections.Dictionary();
    reverseExits.setValue(0, {x: doorPos.x, y: doorPos.y});
    
    let entities =  new EntitiesMap();
    // for (let i = 0; i < 3; i++) {
    //     const key = { x: 3, y: 3 };
    //     entities.add(key, {
    //         id: ""+i,
    //         x: 3,
    //         y: 3,
    //         lookDir: LookDirection.Left,
    //         character: new DummyCharacter(new Neutral(), WeaklingClass, 1),
    //         level: 1,
    //         texture: 'enemy'
    //     });
    // }

    entities.add({ x: 6, y: 6 }, {
        id: ""+3,
        x: 6,
        y: 6,
        lookDir: LookDirection.Left,
        character: new DummyCharacter(new Aggresive(), WeaklingClass, 1),
        level: 1,
        texture: 'enemy'
    });

    entities.add({ x: 6, y: 6 }, {
        id: ""+4,
        x: 6,
        y: 6,
        lookDir: LookDirection.Left,
        character: new DummyCharacter(new Coward(), WeaklingClass, 1),
        level: 1,
        texture: 'enemy'
    });
    
    return {map: map, exits: exits, reverseExits: reverseExits, entities: entities};
}
