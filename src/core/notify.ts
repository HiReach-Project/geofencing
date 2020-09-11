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

const notify = async (targetId: string | number, data: PutTargetResponse) => {
    if (data.checkFenceAreaResult.notifyOutOfFence || data.checkFenceAreaResult.notifyReachedDestination) {
        await triggerNotification(targetId, data.checkFenceAreaResult.notifyMessage);
    }

    if (data.checkCustomAreasResult.notifyReachedCustomArea) {
        await triggerNotification(targetId, data.checkCustomAreasResult.notifyMessage);
    }

    if (data.checkTimetableCustomAreasResult.notifyEarlyArrival || data.checkTimetableCustomAreasResult.notifyLateArrival || data.checkTimetableCustomAreasResult.notifyNoArrival) {
        await triggerNotification(targetId, data.checkTimetableCustomAreasResult.notifyMessage);
    }

    if (data.checkSameLocation.notifySameLocation) {
        await triggerNotification(targetId, data.checkTimetableCustomAreasResult.notifyMessage);
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

        if (supervisor.webPush && supervisor.webPush.endpoint && supervisor.webPush.keys && supervisor.webPush.keys.auth && supervisor.webPush.keys.p256dh)
            webpush.sendNotification(supervisor.webPush, JSON.stringify(notification)).catch(e => console.warn(e));

        if (supervisor.firebase) {
            admin.messaging().send({
                notification: notification,
                token: supervisor.firebase
            }).catch(e => console.warn(e));
        }
    }
};

export { notify, triggerNotification };
