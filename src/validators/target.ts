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

import { PutTarget } from "../models/params/put-target";
import { CustomError } from "../core/custom-error";
import { get, set } from "../core/helpers";
import { PutDeleteTargetSupervisor } from "../models/params/put-delete-target-supervisor";
import { PostTarget } from "../models/params/post-target";
import { CustomConfig } from "../models/custom-config";
import inBetween from "../core/in-between";
import tile from "../core/tile-client";
import { customConfig } from "../config";

const validatePutTargetParams = async (params: PutTarget) => {
    const isFenceOn = await get("targetSessionStatus", params.id);
    if (!isFenceOn) throw new CustomError("There is currently no fencing session on for target", { targetId: params.id });

    if (!params.id || (typeof params.id !== 'string' && typeof params.id !== 'number'))
        throw new CustomError("id is required and must be string or number");

    if (!params.position || !Array.isArray(params.position) || params.position.length !== 2)
        throw new CustomError("position is required and must be array of [Latitude, Longitude]");

    params.position.forEach(position => {
        if (typeof position !== "number") throw new CustomError("position values must be number");
    });

    const target = await get("target", params.id);
    if (!target) throw new CustomError(`Target does not exist`, { targetId: params.id });
};

const validatePutDeleteSupervisorParams = async (params: PutDeleteTargetSupervisor, checkSupervisor = false) => {
    if (!params.targetId || (typeof params.targetId !== 'string' && typeof params.targetId !== 'number'))
        throw new CustomError("targetId is required and must be string or number");

    if (!params.supervisorId || (typeof params.supervisorId !== 'string' && typeof params.supervisorId !== 'number'))
        throw new CustomError("supervisorId is required and must be string or number");

    if (checkSupervisor) {
        const supervisor = await get("supervisor", params.supervisorId);
        if (!supervisor) throw new CustomError("This supervisor does not exist", { supervisorId: params.supervisorId });
    }
}

const validatePostTargetParams = async (params: PostTarget) => {
    if (!params.hasOwnProperty("isFencingOn") || typeof params.isFencingOn !== 'boolean')
        throw new CustomError("isFencingOn is required and  must be a boolean, either true or false");

    const currentSessionState = await get('targetSessionStatus', params.id);

    if (currentSessionState === params.isFencingOn && currentSessionState === true)
        throw new CustomError("A fencing session is already on for this target, please stop current session and start a new one in order to update it");

    if (!params.isFencingOn) return;

    if (!params.id || (typeof params.id !== 'string' && typeof params.id !== 'number'))
        throw new CustomError("id is required and must be string or number");

    if (!params.fence || typeof params.fence !== "object") throw new CustomError("fence is required and must be an object");

    Object.keys(params.fence).forEach(key => {
        if (!['area', 'customAreas', 'timetableCustomAreas'].includes(key)) {
            throw new CustomError("Property doesn't exist in fence object", {
                property: key
            });
        }
    });

    if (!params.fence.area || !Array.isArray(params.fence.area) || !params.fence.area.length)
        throw new CustomError("fence.area is required and must be array of multiple [Latitude, Longitude]");

    params.fence.area.forEach(coordinate => {
        if (!Array.isArray(coordinate) || coordinate.length !== 2)
            throw new CustomError("fence.area values must be array of [Latitude, Longitude]");

        coordinate.forEach(coord => {
            if (typeof coord !== "number")
                throw new CustomError("fence.area coordinates Latitude and Longitude must be number");
        });
    });

    if (params.fence.customAreas) {
        if (!Array.isArray(params.fence.customAreas)) throw new CustomError("fence.customAreas must be array");

        for (let customArea of params.fence.customAreas) {
            if (typeof customArea !== 'object') throw new CustomError("fence.customAreas must be an object");

            Object.keys(customArea).forEach(key => {
                if (!['name', 'position'].includes(key)) {
                    throw new CustomError("Property doesn't exist in fence.customArea object", {
                        property: key
                    });
                }
            });

            if (!customArea.position || !Array.isArray(customArea.position) || customArea.position.length !== 2)
                throw new CustomError("fence.customAreas.position must be array of [Latitude, Longitude]");

            customArea.position.forEach(position => {
                if (typeof position !== "number")
                    throw new CustomError("fence.customAreas.position value must be number");
            });

            if (customArea.name && typeof customArea.name !== 'string')
                throw new CustomError("customArea.name must be string");
        }
    }

    if (params.fence.timetableCustomAreas) {
        if (!Array.isArray(params.fence.timetableCustomAreas))
            throw new CustomError("fence.timetableCustomAreas must be array");

        for (let timetableCustomArea of params.fence.timetableCustomAreas) {
            if (typeof timetableCustomArea !== 'object')
                throw new CustomError("fence.timetableCustomArea must be an object");

            Object.keys(timetableCustomArea).forEach(key => {
                if (!['name', 'position', 'time', 'error'].includes(key)) {
                    throw new CustomError("Property doesn't exist in fence.timetableCustomArea object", {
                        property: key
                    });
                }
            });

            if (!timetableCustomArea.position || !Array.isArray(timetableCustomArea.position) || timetableCustomArea.position.length !== 2)
                throw new CustomError("fence.timetableCustomArea.position must be array of [Latitude, Longitude]");

            timetableCustomArea.position.forEach(position => {
                if (typeof position !== "number")
                    throw new CustomError("fence.timetableCustomArea.position value must be number");
            });

            if (!timetableCustomArea.time || !isValidTimestamp(timetableCustomArea.time))
                throw new CustomError("timetableCustomArea.time must be UNIX Timestamp representation of date-time");

            if (timetableCustomArea.error && (typeof timetableCustomArea.error !== "number" || timetableCustomArea.error < 0))
                throw new CustomError("timetableCustomArea.error must be number >= 0");

            if (timetableCustomArea.name && typeof timetableCustomArea.name !== 'string')
                throw new CustomError("timetableCustomArea.name must be string");
        }
    }
};

const isValidTimestamp = (timestamp) => {
    const newTimestamp = new Date(timestamp).getTime();
    return !isNaN(newTimestamp) && isFinite(newTimestamp);
}

const validateCustomConfig = (customConf: CustomConfig) => {
    if (!customConf || typeof customConf !== 'object') throw new CustomError("customConfig must be an object");

    const customConfigKeys = Object.keys(customConfig);

    Object.keys(customConf).forEach(key => {
        if (!customConfigKeys.includes(key)) {
            throw new CustomError("Property doesn't exist in customConfig object", { property: key });
        }

        if (key === 'targetName') {
            if (typeof customConf[key] !== 'string') throw new CustomError(`${ key } must be string`);
        } else if (key === 'notifyMessageLanguage') {
            if (!customConf[key] || typeof customConf[key] !== 'string') throw new CustomError(`${ key } must be string and must not be empty`);
        } else if (key === 'notifyFenceStartedStatus' || key === 'notifyReachedDestinationStatus' || key === 'notifyLateArrivalStatus' || key === 'notifyEarlyArrivalStatus' || key === 'notifySameLocationStatus') {
            if (typeof customConf[key] !== 'boolean') throw new CustomError(`${ key } must be a boolean`);
        } else {
            if (!customConf[key] || typeof customConf[key] !== 'number' || customConf[key] < 1) throw new CustomError(`${ key } must be a number >= 1`);
        }
    });

    if ((customConf.fenceAreaBorderMeters && !customConf.fenceAreaBetweenPointsMeters) ||
        (!customConf.fenceAreaBorderMeters && customConf.fenceAreaBetweenPointsMeters)) {
        throw new CustomError("If you set fenceAreaBorderMeters then you must set fenceAreaBetweenPointsMeters and the other way around otherwise the fencing might not be accurate");
    }

    if (customConf.fenceAreaBorderMeters && customConf.fenceAreaBetweenPointsMeters) {
        if (customConf.fenceAreaBorderMeters > 150) throw new CustomError("fenceAreaBorderMeters should not be bigger than 150m otherwise the fencing might not be accurate");
        if (customConf.fenceAreaBorderMeters < 20) throw new CustomError("fenceAreaBorderMeters must be at least 20m otherwise the fencing might not be accurate");
        if (customConf.fenceAreaBetweenPointsMeters > 0.5 * customConf.fenceAreaBorderMeters)
            throw new CustomError("fenceAreaBetweenPointsMeters must be maximum 50% of fenceAreaBorderMeters otherwise the fencing might not be accurate");
    }
}

const validateFenceValues = async (params: PostTarget, customConf: CustomConfig) => {
    const result = [];
    const fenceArea = inBetween(params.fence.area, customConf);
    const customAreas = [...params.fence.customAreas || [], ...params.fence.timetableCustomAreas || []];
    let isNear: boolean;

    for (let customArea of customAreas) {
        await set('tempLocation', params.id, customArea.position);
        for (let position of fenceArea) {
            const nearBy = await tile.nearbyQuery("tempLocation")
                .point(position[0], position[1], customConf.fenceAreaBorderMeters)
                .match(params.id)
                .execute();
            if ((isNear = nearBy.count)) break;
        }

        if (!isNear) {
            result.push(customArea);
        }
    }

    if (result.length) throw new CustomError(`Following customAreas and timetableCustomAreas are not in the fence area range`, { badCustomAreas: result });
};

export {
    validatePutTargetParams,
    validatePutDeleteSupervisorParams,
    validatePostTargetParams,
    validateCustomConfig,
    validateFenceValues
}
