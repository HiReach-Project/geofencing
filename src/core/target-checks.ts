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
        mesage: ""
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
                fenceArea[fenceArea.length - 1][1], 30)
            .match(id)
            .execute();
        if (nearByEnd.count) {
            response.notifyReachedDestination = true;
            response.mesage = await getNotifyMessage("notifyReachedDestination", { id });
            await stopFencingSession(id);
            return response;
        }
    }

    if (!isNear) {
        if (fenceNearbyRetry < config.fenceNearbyRetry - 1) {
            fenceNearbyRetry++;
        } else {
            const currentTime = Date.now();
            if (!notificationFenceArea || currentTime - notificationFenceArea >= config.offFenceAreaNotificationIntervalMiutes * 60000) {
                response.notifyOutOfFence = true;
                response.mesage = await getNotifyMessage("notifyOutOfFence", { id });
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
        mesage: ""
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
        response.mesage = await getNotifyMessage("notifyReachedCustomArea", { id, customArea });

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
        mesage: ""
    };

    const timetableCustomAreas = await get('targetTimetableCustomAreas', id) as TimetableCustomArea[];
    if (!timetableCustomAreas.length) return response;

    const notificationTimetableCustomAreas = await get('targetNotificationTimetableCustomAreas', id) as string[];
    const lateNotificationTimetableCustomAreas = await get('targetLateNotificationTimetableCustomAreas', id) as string[];
    const time = Date.now();

    for (let timetableCustomArea of timetableCustomAreas) {
        const nearBy = await tile.nearbyQuery("target")
            .point(
                timetableCustomArea.position[0],
                timetableCustomArea.position[1],
                config.customAreaRadiusMeters)
            .match(id)
            .execute();

        if (lateNotificationTimetableCustomAreas.includes(JSON.stringify(timetableCustomArea.position))) break;
        if (nearBy.count && time - timetableCustomArea.time > (timetableCustomArea.error + 1 || config.timeTableErrorMinutes + 1) * 60000) {
            response.notifyLateArrival = true;
            response.currentTime = time;
            response.timetableCustomArea = timetableCustomArea;
            response.mesage = await getNotifyMessage("notifyLateArrival", { id, timetableCustomArea, time });

            lateNotificationTimetableCustomAreas.push(JSON.stringify(timetableCustomArea.position));
            await set("targetLateNotificationTimetableCustomAreas", id, lateNotificationTimetableCustomAreas);
            break;
        }

        if (notificationTimetableCustomAreas.includes(JSON.stringify(timetableCustomArea.position))) break;

        if (!nearBy.count && time - timetableCustomArea.time > (timetableCustomArea.error + 1 || config.timeTableErrorMinutes + 1) * 60000) {
            response.notifyNoArrival = true;
            response.currentTime = time;
            response.timetableCustomArea = timetableCustomArea;
            response.mesage = await getNotifyMessage("notifyNoArrival", { id, timetableCustomArea });

            notificationTimetableCustomAreas.push(JSON.stringify(timetableCustomArea.position));
            await set("targetNotificationTimetableCustomAreas", id, notificationTimetableCustomAreas);
            break;
        }

        if (nearBy.count && time < timetableCustomArea.time) {
            response.notifyEarlyArrival = true;
            response.currentTime = time;
            response.timetableCustomArea = timetableCustomArea;
            response.mesage = await getNotifyMessage("notifyEarlyArrival", { id, timetableCustomArea, time });

            notificationTimetableCustomAreas.push(JSON.stringify(timetableCustomArea.position));
            await set("targetNotificationTimetableCustomAreas", id, notificationTimetableCustomAreas);
            break;
        }
    }

    return response;
};

export { checkFenceArea, checkCustomAreas, checkTimetableCustomAreas };
