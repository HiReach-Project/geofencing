/* Geofencing API - a NodeJs + Redis API designed to monitor travelers
during a planned trip.

Copyright (C) 2020, University Politehnica of Bucharest, member
of the HiReach Project consortium <https://hireach-project.eu/>
<andrei[dot]gheorghiu[at]upb[dot]ro. This project has received
funding from the European Union’s Horizon 2020 research and
innovation programme under grant agreement no. 769819.

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
