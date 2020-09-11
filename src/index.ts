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
