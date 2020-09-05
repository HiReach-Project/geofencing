import { CustomArea } from "./custom-area";
import { TimetableCustomArea } from "./timetable-custom-area";

export class PutTargetResponse {
    checkFenceAreaResult: {
        notifyReachedDestination: boolean,
        notifyOutOfFence: boolean,
        message: string
    };
    checkCustomAreasResult: {
        notifyReachedCustomArea: boolean,
        message: string,
        customArea: CustomArea | null
    };
    checkTimetableCustomAreasResult: {
        currentTime: number,
        notifyNoArrival: boolean,
        notifyLateArrival: boolean,
        notifyEarlyArrival: boolean,
        message: string,
        timetableCustomArea: null | TimetableCustomArea
    };
}
