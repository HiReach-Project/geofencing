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

import tile from "./tile-client";
import { get, set, stopFencingSession } from "./helpers";
import { TimetableCustomArea } from "../models/timetable-custom-area";
import { CustomArea } from "../models/custom-area";
import { Position } from "../models/position";
import { getNotifyMessage } from "./get-notify-message";
import { CustomConfig } from "../models/custom-config";

const checkFenceArea = async (id: string | number, config: CustomConfig) => {
    const response = {
        notifyReachedDestination: false,
        notifyOutOfFence: false,
        reachedDestination: false,
        notifyMessage: ""
    };

    let fenceArea = await get("targetFenceArea", id) as Position[];

    const notificationFenceArea = await get('targetNotificationFenceArea', id);
    let fenceNearbyRetry = await get('targetFenceNearbyRetry', id);

    let isNear: boolean;
    for (let i = 0; i < fenceArea.length; i++) {
        const nearBy = await tile.nearbyQuery("target").point(fenceArea[i][0], fenceArea[i][1], config.fenceAreaBorderMeters).match(id).execute();
        if ((isNear = nearBy.count)) {
            if (fenceArea[i - 1]) {
                fenceArea = fenceArea.slice(i - 1);
                await set("targetFenceArea", id, fenceArea);
            }
            fenceNearbyRetry = 0;
            break;
        }
    }

    if (fenceArea.length <= 20) {
        const nearByEnd = await tile.nearbyQuery("target")
            .point(
                fenceArea[fenceArea.length - 1][0],
                fenceArea[fenceArea.length - 1][1], 20)
            .match(id)
            .execute();
        if (nearByEnd.count) {
            if (config.notifyReachedDestinationStatus) {
                response.notifyReachedDestination = true;
                response.notifyMessage = await getNotifyMessage("notifyReachedDestination", { id });
            }
            response.reachedDestination = true;
            await stopFencingSession(id);
            return response;
        }
    }

    if (!isNear) {
        if (fenceNearbyRetry < config.fenceNearbyRetry - 1) {
            fenceNearbyRetry++;
        } else {
            const currentTime = Date.now();
            if (!notificationFenceArea || currentTime - notificationFenceArea >= config.offFenceAreaNotificationIntervalMinutes * 60000) {
                response.notifyOutOfFence = true;
                response.notifyMessage = await getNotifyMessage("notifyOutOfFence", { id });
                await set('targetNotificationFenceArea', id, currentTime);
            }
        }
    }

    await set('targetFenceNearbyRetry', id, fenceNearbyRetry);

    return response;
};

const checkCustomAreas = async (id: string | number, config: CustomConfig) => {
    const response = {
        customArea: null,
        notifyReachedCustomArea: false,
        notifyMessage: ""
    };

    const customAreas = await get('targetFenceCustomAreas', id) as CustomArea[];
    if (!customAreas.length) return response;

    const notificationCustomArea = await get('targetNotificationCustomAreas', id) as string[];

    for (let customArea of customAreas) {
        const nearBy = await tile.nearbyQuery("target").point(customArea.position[0], customArea.position[1], config.customAreaRadiusMeters).match(id).execute();

        if (!nearBy.count) continue;
        if (notificationCustomArea.includes(JSON.stringify(customArea.position))) break;

        response.customArea = customArea;
        response.notifyReachedCustomArea = true;
        response.notifyMessage = await getNotifyMessage("notifyReachedCustomArea", { id, customArea });

        notificationCustomArea.push(JSON.stringify(customArea.position));
        await set('targetNotificationCustomAreas', id, notificationCustomArea);

        break;
    }

    return response;
};

const checkTimetableCustomAreas = async (id: string | number, config: CustomConfig) => {
    const response = {
        currentTime: 0,
        timetableCustomArea: null,
        notifyLateArrival: false,
        notifyNoArrival: false,
        notifyEarlyArrival: false,
        notifyMessage: ""
    };

    const timetableCustomAreas = await get('targetTimetableCustomAreas', id) as TimetableCustomArea[];
    if (!timetableCustomAreas.length) return response;

    const notificationTimetableCustomAreas = await get('targetNotificationTimetableCustomAreas', id) as string[];
    const lateNotificationTimetableCustomAreas = await get('targetLateNotificationTimetableCustomAreas', id) as string[];
    const earlyNotificationTimetableCustomAreas = await get('targetEarlyNotificationTimetableCustomAreas', id) as string[];
    const time = Date.now();

    for (let timetableCustomArea of timetableCustomAreas) {
        if (earlyNotificationTimetableCustomAreas.includes(JSON.stringify(timetableCustomArea.position))) continue;
        if (lateNotificationTimetableCustomAreas.includes(JSON.stringify(timetableCustomArea.position))) continue;

        const nearBy = await tile.nearbyQuery("target")
            .point(
                timetableCustomArea.position[0],
                timetableCustomArea.position[1],
                config.customAreaRadiusMeters)
            .match(id)
            .execute();

        if (config.notifyLateArrivalStatus && nearBy.count && time - timetableCustomArea.time > (timetableCustomArea.error + 1 || config.timeTableErrorMinutes + 1) * 60000) {
            response.notifyLateArrival = true;
            response.currentTime = time;
            response.timetableCustomArea = timetableCustomArea;
            response.notifyMessage = await getNotifyMessage("notifyLateArrival", { id, timetableCustomArea, time });

            lateNotificationTimetableCustomAreas.push(JSON.stringify(timetableCustomArea.position));
            await set("targetLateNotificationTimetableCustomAreas", id, lateNotificationTimetableCustomAreas);
            break;
        }

        if (notificationTimetableCustomAreas.includes(JSON.stringify(timetableCustomArea.position))) continue;

        if (!nearBy.count && time - timetableCustomArea.time > (timetableCustomArea.error + 1 || config.timeTableErrorMinutes + 1) * 60000) {
            response.notifyNoArrival = true;
            response.currentTime = time;
            response.timetableCustomArea = timetableCustomArea;
            response.notifyMessage = await getNotifyMessage("notifyNoArrival", { id, timetableCustomArea });

            notificationTimetableCustomAreas.push(JSON.stringify(timetableCustomArea.position));
            await set("targetNotificationTimetableCustomAreas", id, notificationTimetableCustomAreas);
            break;
        }

        if (nearBy.count && time < timetableCustomArea.time) {
            if (config.notifyEarlyArrivalStatus) {
                response.notifyEarlyArrival = true;
                response.currentTime = time;
                response.timetableCustomArea = timetableCustomArea;
                response.notifyMessage = await getNotifyMessage("notifyEarlyArrival", {
                    id,
                    timetableCustomArea,
                    time
                });
            }

            earlyNotificationTimetableCustomAreas.push(JSON.stringify(timetableCustomArea.position));
            await set("targetEarlyNotificationTimetableCustomAreas", id, earlyNotificationTimetableCustomAreas);
            break;
        }
    }

    return response;
};

const checkSameLocation = async (id: string | number, config: CustomConfig | null = null) => {
    const response = {
        notifySameLocation: false,
        notifyMessage: ""
    };

    if (!config.notifySameLocationStatus) return response;

    const lastLocation = await get("targetLastLocation", id);
    let target;

    if (!lastLocation.length) {
        target = await get("target", id);
        await set("targetLastLocation", id, [target.coordinates, Date.now()]);
        return response;
    }

    const nearBy = await tile.nearbyQuery("target").point(lastLocation[0][1], lastLocation[0][0], 7).match(id).execute();

    if (!nearBy.count) {
        target = await get("target", id);
        await set("targetLastLocation", id, [target.coordinates, Date.now()]);
        return response;
    }

    if (Date.now() - lastLocation[1] >= 60000 * config.sameLocationTime) {
        await set("targetLastLocation", id, [lastLocation[0], Date.now()]);
        response.notifySameLocation = true;
        response.notifyMessage = await getNotifyMessage("notifySameLocation", { id });
    }

    return response;
}

export { checkFenceArea, checkCustomAreas, checkTimetableCustomAreas, checkSameLocation };
