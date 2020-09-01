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
    | "notifyFenceStarted";

const getNotifyMessage = async (notifyType: notifyType, needle: Needle) => {
    if (!needle.id) throw new CustomError("needle.id is required for notify mesasges");

    const customConf: CustomConfig = await generateCustomConfig(undefined, needle.id);

    const map = {
        id: customConf.targetName || needle.id,
        customArea: needle.customArea ? needle.customArea.name || JSON.stringify(needle.customArea.position) : '',
        timetableCustomArea: needle.timetableCustomArea ? needle.timetableCustomArea.name || JSON.stringify(needle.timetableCustomArea.position) : '',
        timeDifference: needle.time && needle.timetableCustomArea ? getTimeDifference(needle.time, needle.timetableCustomArea) : '',
    }

    const languageMessages = notifyMessages[customConf.notifyMessageLanguage] || notifyMessages[customConfig.notifyMessageLanguage];
    let message = languageMessages[notifyType];

    Object.keys(map).forEach(key => message = message.replace(new RegExp(`{{${ key }}}`, 'g'), map[key]));

    return message;
}

export { getNotifyMessage }
