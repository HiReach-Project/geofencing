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

import { PutTargetResponse } from "../models/put-target-response";
import { get, isFirebaseAvailable, isWebPushAvailable } from "./helpers";
import webpush from "web-push";
import { notifyTitle } from "../notify-messages";
import { Subscription } from "../models/subscription";
import admin from "firebase-admin";
import fs from "fs";

const notify = (targetId: string | number, data: PutTargetResponse) => {
    if (data.checkFenceAreaResult.notifyOutOfFence || data.checkFenceAreaResult.notifyReachedDestination) {
        triggerNotification(targetId, data.checkFenceAreaResult.notifyMessage).then();
    }

    if (data.checkCustomAreasResult.notifyReachedCustomArea) {
        triggerNotification(targetId, data.checkCustomAreasResult.notifyMessage).then();
    }

    if (data.checkTimetableCustomAreasResult.notifyEarlyArrival || data.checkTimetableCustomAreasResult.notifyLateArrival || data.checkTimetableCustomAreasResult.notifyNoArrival) {
        triggerNotification(targetId, data.checkTimetableCustomAreasResult.notifyMessage).then();
    }

    if (data.checkSameLocation.notifySameLocation) {
        triggerNotification(targetId, data.checkSameLocation.notifyMessage).then();
    }
};

const triggerNotification = async (targetId: string | number, message: string) => {
    if (!isWebPushAvailable() && !isFirebaseAvailable()) return;

    const targetSupervisorIds = await get("targetSupervisor", targetId);

    if (!targetSupervisorIds) return;

    const notification = {
        title: notifyTitle,
        body: message
    };

    for (let targetSupervisorId of targetSupervisorIds) {
        const supervisor = await get("supervisor", targetSupervisorId) as Subscription;

        if (!supervisor) {
            const e = new Error(`Supervisor  with id ${ targetSupervisorId } doesn't exist`)
            logPushError("custom", { name: e.name, message: e.message, stack: e.stack });
            return;
        }

        if (supervisor.webPush) {
            try {
                await webpush.sendNotification(supervisor.webPush, JSON.stringify(notification));
            } catch (e) {
                logPushError("webpush", { name: e.name, message: e.message, stack: e.stack });
            }
        }

        if (supervisor.firebase) {
            try {
                await admin.messaging().send({ notification: notification, token: supervisor.firebase });
            } catch (e) {
                logPushError("firebase", { name: e.name, message: e.message, stack: e.stack });
            }
        }
    }
};

type PushTypeModel = "webpush" | "firebase" | "custom";

const logPushError = (errorType: PushTypeModel, error: { [key: string]: any }) => {
    const date = new Date();
    const errorObject = { date, errorType, error };
    const fileName = `${ date.getDate() }-${ date.getMonth() }-${ date.getFullYear() }.txt`;
    const path = `${ process.cwd() }/push-logs/${ fileName }`;
    const content = JSON.stringify(errorObject)

    fs.appendFile(path, `${ content }%separator%`, function (err) {
        if (err) throw err;
    });
}
export { notify, triggerNotification };
