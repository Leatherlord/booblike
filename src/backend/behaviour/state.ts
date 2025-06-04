import { Point2d } from "../../common/interfaces";

export interface State {
    move: () => Point2d;
}

export class PlayerState implements State {
    public move(): Point2d {
        console.log("set to playerState")
        return { x: 0, y: 0 };
    }
}

export class Aggresive implements State {
    public move(): Point2d {
        console.log("set to aggresive")
        return { x: 0, y: 0 };
    }
}

export class Neutral implements State {
    public move(): Point2d {
        console.log("set to neutral")
        return { x: 0, y: 0 };
    }
}

export class Coward implements State {
    public move(): Point2d {
        console.log("set to coward")
        return { x: 0, y: 0 };
    }
}