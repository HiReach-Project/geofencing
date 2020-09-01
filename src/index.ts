import express from 'express';
import bodyParser from "body-parser";
import cors from "cors";

import tile from "./core/tile-client";
import target from "./controller/target";
import supervisor from "./controller/supervisor";
import { config, customConfig } from "./config";
import initPushSystem from "./core/init-push-system";
import HandleHttp from "./core/handle-http";
import { scan } from "./core/helpers";
import { validateCustomConfig } from "./validators/target";
import { validateNotifyMessages } from "./validators/notify-messages";

const app = express();

validateCustomConfig(customConfig);
validateNotifyMessages();
initPushSystem();

app.use(bodyParser.json());
app.use(cors())

app.use("/target", target);
app.use("/supervisor", supervisor);

app.get("/", HandleHttp(async (request, repsonse) => {
    const response: any = {
        status: `ok`,
        message: `App runs on port ${ config.port }`,
        data: {}
    };

    response.data.keys = await tile.keys("*");
    response.data.target = await scan("target");
    response.data.targetCustomConfig = await scan("targetCustomConfig");
    response.data.targetSessionStatus = await scan("targetSessionStatus");
    response.data.targetName = await scan("targetName");
    response.data.targetFenceArea = await scan("targetFenceArea");
    response.data.targetFenceCustomAreas = await scan("targetFenceCustomAreas");
    response.data.targetTimetableCustomAreas = await scan("targetTimetableCustomAreas");
    response.data.targetFenceNearbyRetry = await scan("targetFenceNearbyRetry");
    response.data.targetNotificationFenceArea = await scan("targetNotificationFenceArea");
    response.data.targetNotificationCustomAreas = await scan("targetNotificationCustomAreas");
    response.data.targetNotificationTimetableCustomAreas = await scan("targetNotificationTimetableCustomAreas");
    response.data.targetLateNotificationTimetableCustomAreas = await scan("targetLateNotificationTimetableCustomAreas");
    response.data.supervisor = await scan("supervisor");
    response.data.targetSupervisor = await scan("targetSupervisor");

    repsonse.status(200);
    repsonse.json(response);
}));

app.get("/flush", HandleHttp(async (request, response) => {
    response.status(200);
    if (process.env.env === 'development') {
        await tile.flushdb();
        response.send("ALL DELETED");
    } else {
        response.send("You are not on DEV env");
    }
}));

app.get("/delete/:key/:id", HandleHttp(async (request, response) => {
    response.status(200);
    if (process.env.env === 'development') {
        const params = request.params;
        await tile.del(params.key, params.id);
        response.send(`Deleted ${ params.key } - ${ params.id }`);
    } else {
        response.send("You are not on DEV env");
    }
}));

app.listen(config.port || 80);
