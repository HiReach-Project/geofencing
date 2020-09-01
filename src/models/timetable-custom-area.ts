import { Position } from "./position";

export interface TimetableCustomArea {
    name?: string,
    position: Position,
    time: number,
    error?: number
}
