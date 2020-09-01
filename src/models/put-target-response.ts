import { CustomArea } from "./custom-area";
import { TimetableCustomArea } from "./timetable-custom-area";

export class PutTargetResponse {
    checkFenceAreaResult: {
        notifyReachedDestination: boolean,
        notifyOutOfFence: boolean,
        mesage: string
    };
    checkCustomAreasResult: {
        notifyReachedCustomArea: boolean,
        mesage: string,
        customArea: CustomArea | null
    };
    checkTimetableCustomAreasResult: {
        currentTime: number,
        notifyNoArrival: boolean,
        notifyLateArrival: boolean,
        notifyEarlyArrival: boolean,
        mesage: string,
        timetableCustomArea: null | TimetableCustomArea
    };
}
