import { NotifyMessages } from "./models/notify-messages";

const target = "{{id}}";
const timetableCustomArea = "{{timetableCustomArea}}";
const customArea = "{{customArea}}";
const timeDifference = "{{timeDifference}}";

const notifyMessages: NotifyMessages = {
    en: {
        notifyOutOfFence: `WARNING! ${ target } went out of fence area!`,
        notifyReachedCustomArea: `${ target } reached ${ customArea }.`,
        notifyNoArrival: `WARNING ${ target } didn't reach ${ timetableCustomArea } in time!`,
        notifyLateArrival: `${ target } reached ${ timetableCustomArea } ${ timeDifference } later.`,
        notifyEarlyArrival: `${ target } reached ${ timetableCustomArea } ${ timeDifference } earlier.`,
        notifyReachedDestination: `${ target } reached the destination`,
        notifyFenceStarted: `${ target } started a new fence session`
    }
}

const notifyTitle: string = "APP_NAME";


export { notifyMessages, notifyTitle }
