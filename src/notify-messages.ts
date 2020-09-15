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

import { NotifyMessages } from "./models/notify-messages";

const target = "{{id}}";
const timetableCustomArea = "{{timetableCustomArea}}";
const customArea = "{{customArea}}";
const timeDifference = "{{timeDifference}}";
const sameLocationTime = "{{sameLocationTime}}";

const notifyMessages: NotifyMessages = {
    en: {
        notifyOutOfFence: `WARNING! ${ target } went out of fence area!`,
        notifyReachedCustomArea: `${ target } reached ${ customArea }.`,
        notifyNoArrival: `WARNING ${ target } didn't reach ${ timetableCustomArea } in time!`,
        notifyLateArrival: `${ target } reached ${ timetableCustomArea } ${ timeDifference } later.`,
        notifyEarlyArrival: `${ target } reached ${ timetableCustomArea } ${ timeDifference } earlier.`,
        notifyReachedDestination: `${ target } reached the destination`,
        notifyFenceStarted: `${ target } started a new fence session`,
        notifySameLocation: `${ target } is in the same location for ${ sameLocationTime } minute(s)!`
    }
}

const notifyTitle: string = "APP_NAME";


export { notifyMessages, notifyTitle }
