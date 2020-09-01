import { CustomConfig } from "../custom-config";
import { CustomArea } from "../custom-area";
import { TimetableCustomArea } from "../timetable-custom-area";
import { Position } from "../position";

export interface PostTarget {
    id: string | number;
    isFencingOn: boolean;
    fence: {
        area: Position[];
        customAreas?: CustomArea[];
        timetableCustomAreas?: TimetableCustomArea[];
    };
    customConfig?: CustomConfig;
}
