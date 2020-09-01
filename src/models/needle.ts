import { CustomArea } from "./custom-area";
import { TimetableCustomArea } from "./timetable-custom-area";

export interface Needle {
    id?: string | number;
    customArea?: CustomArea | null;
    timetableCustomArea?: TimetableCustomArea;
    time?: number;
}
