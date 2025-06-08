import { Point2d, World } from "../../common/interfaces";
import { MovementResult, neutralMovement } from "./movement";

export interface State {
    move: (from: Point2d, world: World) => MovementResult;
}

export class PlayerState implements State {
    public move(from: Point2d, world: World): MovementResult {
        console.log("set to playerState")
        return {to: { x: 0, y: 0 }};
    }
}

export class Aggresive implements State {
    public move(from: Point2d, world: World): MovementResult {
        console.log("set to aggresive")
        return {to: { x: 0, y: 0 }};
    }
}

export class Neutral implements State {
    public move(from: Point2d, world: World): MovementResult {
        return neutralMovement(from, world);
    }
}

export class Coward implements State {
    public move(from: Point2d, world: World): MovementResult {
        console.log("set to coward")
        return {to: { x: 0, y: 0 }};
    }
}
