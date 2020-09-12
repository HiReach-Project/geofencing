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
import { TimetableCustomArea } from "../models/timetable-custom-area";
import { CustomConfig } from "../models/custom-config";
import { config, customConfig } from "../config";

const treatAsNormal = ['target', 'tempLocation'];

const get = async (collection: string, id: string | number) => {
    let result = await tile.get(collection, id).catch(() => null);

    if (!result) return null;
    if (treatAsNormal.includes(collection)) return result["object"];

    return JSON.parse(result["object"]);
};

const set = async (collection: string, id: string | number, value: any) => {
    if (treatAsNormal.includes(collection)) {
        await tile.set(collection, id, value);
        return;
    }

    await tile.set(collection, id, JSON.stringify(value), null, { type: 'string' })
};

const scan = async (collection: string) => {
    let result = await tile.scanQuery(collection).execute();

    if (!result.objects.length || treatAsNormal.includes(collection)) return result;

    result.objects.forEach(res => res.object = JSON.parse(res["object"]));
    return result
};

const getTimeDifference = (time: number, timetableCustomArea: TimetableCustomArea) => {
    let unixTime = time > timetableCustomArea.time ? time - timetableCustomArea.time : timetableCustomArea.time - time;
    let seconds = (unixTime / 1000).toFixed(0);
    let minutes: number | string = Math.floor(parseInt(seconds) / 60);
    let hours = '';
    if (minutes > 59) {
        hours = Math.floor(minutes / 60).toString();
        hours = (parseInt(hours) >= 10) ? hours : "0" + hours;
        minutes = minutes - (parseInt(hours) * 60);
        minutes = (minutes >= 10) ? minutes.toString() : "0" + minutes;
    }

    seconds = Math.floor(parseInt(seconds) % 60).toString();
    seconds = (parseInt(seconds) >= 10) ? seconds.toString() : "0" + seconds;

    hours = hours || "00";
    minutes = minutes || "00";
    seconds = seconds || "00";

    return `${ hours }h:${ minutes }m:${ seconds }s`;
};

const stopFencingSession = async (id: string | number) => {
    await set("target", id, [0, 0]);
    await set("targetSessionStatus", id, false);
    await set("targetFenceArea", id, []);
    await set("targetFenceCustomAreas", id, []);
    await set("targetTimetableCustomAreas", id, []);
    await set("targetFenceNearbyRetry", id, 0);
    await set("targetNotificationFenceArea", id, 0);
    await set("targetNotificationCustomAreas", id, []);
    await set("targetNotificationTimetableCustomAreas", id, []);
    await set("targetLateNotificationTimetableCustomAreas", id, []);
    await set("targetEarlyNotificationTimetableCustomAreas", id, []);
    await set("tempLocation", id, [0, 0]);
    await set("targetLastLocation", id, []);
};

const generateCustomConfig = async (customConf: CustomConfig | undefined, targetId: number | string): Promise<CustomConfig> => {
    let finalConfig: CustomConfig = { ...customConfig, ...(await get("targetCustomConfig", targetId) || {}) }
    if (customConf) finalConfig = { ...finalConfig, ...customConf };

    return finalConfig;
};

const isWebPushAvailable = () => {
    return config.webPush && config.webPush.privateKey && config.webPush.publicKey && config.webPush.mailTo;
};

const isFirebaseAvailable = () => {
    return config.firebase &&
        config.firebase.credential &&
        config.firebase.credential.type &&
        config.firebase.credential.project_id &&
        config.firebase.credential.private_key_id &&
        config.firebase.credential.private_key &&
        config.firebase.credential.client_email &&
        config.firebase.credential.client_id &&
        config.firebase.credential.auth_uri &&
        config.firebase.credential.token_uri &&
        config.firebase.credential.auth_provider_x509_cert_url &&
        config.firebase.credential.client_x509_cert_url &&
        config.firebase.databaseUrl;
}

export {
    get,
    set,
    scan,
    getTimeDifference,
    stopFencingSession,
    generateCustomConfig,
    isWebPushAvailable,
    isFirebaseAvailable
}
