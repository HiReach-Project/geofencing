import express from 'express';
import { checkCustomAreas, checkFenceArea, checkTimetableCustomAreas } from "../core/target-checks";
import { addSupervisor, removeSupervisor } from "../core/target-supervisor";
import HandleHttp from "../core/handle-http";
import inBetween from "../core/in-between";
import { generateCustomConfig, set, stopFencingSession } from "../core/helpers";
import { CustomConfig } from "../models/custom-config";
import { PutTarget } from "../models/params/put-target";
import {
    validateCustomConfig,
    validateFenceValues,
    validatePostTargetParams,
    validatePutDeleteSupervisorParams,
    validatePutTargetParams
} from "../validators/target";
import { PutDeleteTargetSupervisor } from "../models/params/put-delete-target-supervisor";
import { PostTarget } from "../models/params/post-target";
import { CustomResponse } from "../core/custom-response";
import { PutTargetResponse } from "../models/put-target-response";
import { notify, triggerNotification } from "../core/notify";
import { getNotifyMessage } from "../core/get-notify-message";

const router = express.Router();

router.post('', HandleHttp(async (request, response) => {
    const params: PostTarget = request.body;

    await validatePostTargetParams(params);

    if (!params.isFencingOn) {
        await stopFencingSession(params.id);
        response.json(new CustomResponse("Session status updated", {
            sessionStatus: params.isFencingOn,
            notifyFenceStarted: false,
        }));
    } else {
        if (params.customConfig) validateCustomConfig(params.customConfig);
        const customConf = await generateCustomConfig(params.customConfig, params.id);
        await validateFenceValues(params, customConf);

        await set("targetCustomConfig", params.id, customConf);
        await set("target", params.id, params.fence.area[0]);
        await set("targetSessionStatus", params.id, params.isFencingOn);
        await set("targetFenceArea", params.id, inBetween(params.fence.area, customConf));
        await set("targetFenceCustomAreas", params.id, params.fence.customAreas || []);
        await set("targetTimetableCustomAreas", params.id, params.fence.timetableCustomAreas || []);
        await set("targetFenceNearbyRetry", params.id, 0);
        await set("targetNotificationFenceArea", params.id, 0);
        await set("targetNotificationCustomAreas", params.id, []);
        await set("targetNotificationTimetableCustomAreas", params.id, []);
        await set("targetLateNotificationTimetableCustomAreas", params.id, []);

        await triggerNotification(params.id, await getNotifyMessage('notifyFenceStarted', {
            id: params.id,
            time: Date.now()
        }));

        response.status(200);
        response.json(new CustomResponse("Session status updated", {
            sessionStatus: params.isFencingOn,
            notifyFenceStarted: true,
            targetId: params.id,
            targetName: customConf.targetName || ''
        }));
    }
}));

router.put('', HandleHttp(async (request, response) => {
    const params: PutTarget = request.body;

    await validatePutTargetParams(params);

    let data = new PutTargetResponse();
    const customConf = await generateCustomConfig(undefined, params.id);

    await set("target", params.id, params.position);

    data.checkFenceAreaResult = await checkFenceArea(params.id, customConf);
    data.checkCustomAreasResult = await checkCustomAreas(params.id, customConf);
    data.checkTimetableCustomAreasResult = await checkTimetableCustomAreas(params.id, customConf);

    await notify(params.id, data);
    response.status(200);
    response.json(new CustomResponse("Target updated", data));
}));

router.put("/supervisor", HandleHttp(async (request, response) => {
    const params: PutDeleteTargetSupervisor = request.body;

    await validatePutDeleteSupervisorParams(params, true);
    await addSupervisor(params);

    response.status(200);
    response.json(new CustomResponse("Supervisor added to target"));
}));

router.delete("/supervisor", HandleHttp(async (request, response) => {
    const params: PutDeleteTargetSupervisor = request.body;

    await validatePutDeleteSupervisorParams(params);
    await removeSupervisor(params);

    response.status(200);
    response.json(new CustomResponse("Supervisor removed from target"));
}));

router.put('/custom-config', HandleHttp(async (request, response) => {
    const params: { id: string | number, customConfig: CustomConfig } = request.body;
    validateCustomConfig(params.customConfig);

    await set("targetCustomConfig", params.id, await generateCustomConfig(params.customConfig, params.id));

    response.status(200);
    response.json(new CustomResponse("Target custom config updated!"));
}));

export default router;

