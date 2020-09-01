import { Position } from "../models/position";
import { CustomConfig } from "../models/custom-config";

const distance = (p1: Position, p2: Position): number => {
    const R = 6371e3;
    const radius1 = p1[0] * Math.PI / 180;
    const radius2 = p2[0] * Math.PI / 180;
    const dLat = (p2[0] - p1[0]) * Math.PI / 180;
    const dLong = (p2[1] - p1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(radius1) * Math.cos(radius2) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.floor(R * c);
}

const inBetween = (points: Position[], customConf: CustomConfig) => {
    const result = [];
    const meterPerSegment = customConf.fenceAreaBetweenPointsMeters;

    for (let i = 0; i < points.length; i++) {
        if (!points[i + 1]) {
            result.push(points[i]);
            break;
        }

        let p1 = points[i];
        let p2 = points[i + 1];
        let dist = distance(p1, p2);
        let scale = 1 / (dist / meterPerSegment);

        for (let j = 0; j <= 1; j += scale) {
            let px = p1[0] + j * (p2[0] - p1[0]);
            let py = p1[1] + j * (p2[1] - p1[1]);
            result.push([px, py]);
        }
    }
    return result;
};

export default inBetween;
