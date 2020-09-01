import { PutTargetResponse } from "../models/put-target-response";
import { get, isFirebaseAvailable, isWebPushAvailable } from "./helpers";
import webpush from "web-push";
import { notifyTitle } from "../notify-messages";
import { Subscription } from "../models/subscription";
import admin from "firebase-admin";

const notify = async (targetId: string | number, data: PutTargetResponse) => {
    if (data.checkFenceAreaResult.notifyOutOfFence || data.checkFenceAreaResult.notifyReachedDestination) {
        await triggerNotification(targetId, data.checkFenceAreaResult.mesage);
    }

    if (data.checkCustomAreasResult.notifyReachedCustomArea) {
        await triggerNotification(targetId, data.checkCustomAreasResult.mesage);
    }

    if (data.checkTimetableCustomAreasResult.notifyEarlyArrival || data.checkTimetableCustomAreasResult.notifyLateArrival || data.checkTimetableCustomAreasResult.notifyNoArrival) {
        await triggerNotification(targetId, data.checkTimetableCustomAreasResult.mesage);
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
