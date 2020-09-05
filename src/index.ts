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

app.get("/", HandleHttp(async (request, response) => {
    const res: any = {
        status: `ok`,
        message: `App runs on port ${ config.port }`,
        data: {}
    };

    res.data.keys = await tile.keys("*");
    res.data.target = await scan("target");
    res.data.targetCustomConfig = await scan("targetCustomConfig");
    res.data.targetSessionStatus = await scan("targetSessionStatus");
    res.data.targetName = await scan("targetName");
    res.data.targetFenceArea = await scan("targetFenceArea");
    res.data.targetFenceCustomAreas = await scan("targetFenceCustomAreas");
    res.data.targetTimetableCustomAreas = await scan("targetTimetableCustomAreas");
    res.data.targetFenceNearbyRetry = await scan("targetFenceNearbyRetry");
    res.data.targetNotificationFenceArea = await scan("targetNotificationFenceArea");
    res.data.targetNotificationCustomAreas = await scan("targetNotificationCustomAreas");
    res.data.targetNotificationTimetableCustomAreas = await scan("targetNotificationTimetableCustomAreas");
    res.data.targetLateNotificationTimetableCustomAreas = await scan("targetLateNotificationTimetableCustomAreas");
    res.data.supervisor = await scan("supervisor");
    res.data.targetSupervisor = await scan("targetSupervisor");

    response.status(200);
    response.json(res);
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
