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

import { generateCustomConfig, getTimeDifference } from "./helpers";
import { Needle } from "../models/needle";
import { notifyMessages } from "../notify-messages";
import { CustomError } from "./custom-error";
import { CustomConfig } from "../models/custom-config";
import { customConfig } from "../config";

type notifyType =
    "notifyOutOfFence"
    | "notifyReachedCustomArea"
    | "notifyLateArrival"
    | "notifyNoArrival"
    | "notifyEarlyArrival"
    | "notifyReachedDestination"
    | "notifyFenceStarted"
    | "notifySameLocation";

const getNotifyMessage = async (notifyType: notifyType, needle: Needle) => {
    if (!needle.id) throw new CustomError("needle.id is required for notify mesasges");

    const customConf: CustomConfig = await generateCustomConfig(undefined, needle.id);

    const map = {
        id: customConf.targetName || needle.id,
        customArea: needle.customArea ? needle.customArea.name || JSON.stringify(needle.customArea.position) : '',
        timetableCustomArea: needle.timetableCustomArea ? needle.timetableCustomArea.name || JSON.stringify(needle.timetableCustomArea.position) : '',
        timeDifference: needle.time && needle.timetableCustomArea ? getTimeDifference(needle.time, needle.timetableCustomArea) : '',
        sameLocationTime: customConf.sameLocationTime
    }

    if (!customConf.notifyMessageLanguage && !customConfig.notifyMessageLanguage) {
        customConfig.notifyMessageLanguage = 'en';
    }

    const languageMessages = notifyMessages[customConf.notifyMessageLanguage] || notifyMessages[customConfig.notifyMessageLanguage];
    let message = languageMessages[notifyType];

    Object.keys(map).forEach(key => message = message.replace(new RegExp(`{{${ key }}}`, 'g'), map[key]));

    return message;
}

export { getNotifyMessage }
