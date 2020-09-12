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

import { notifyMessages } from "../notify-messages";
import { CustomError } from "../core/custom-error";
import { customConfig } from "../config";

const validateNotifyMessages = () => {
    if (!customConfig.notifyMessageLanguage) customConfig.notifyMessageLanguage = 'en';

    if (!Object.keys(notifyMessages).length) throw new CustomError("notifyMessages must have at least one entry");
    if (!notifyMessages[customConfig.notifyMessageLanguage]) throw new CustomError("notifyMessages doesn't have entry for language specified in customConfig", {
        "customConfig.notifyMessageLanguage": customConfig.notifyMessageLanguage
    });

    const notifyMessagesTypes = ['notifyOutOfFence', 'notifyReachedCustomArea', 'notifyNoArrival', 'notifyLateArrival', 'notifyEarlyArrival', 'notifyReachedDestination', 'notifyFenceStarted', 'notifySameLocation'];

    Object.keys(notifyMessages).forEach(language => {
        const languageMessages = notifyMessages[language];

        if (typeof languageMessages !== "object") throw new CustomError("Each language in notifyMessages must be an object");

        Object.keys(languageMessages).forEach(messageType => {
            if (!notifyMessagesTypes.includes(messageType)) throw new CustomError(`${ messageType } is not a property of notifyMessages['language'] object`);
        });

        notifyMessagesTypes.forEach(type => {
            if (!languageMessages[type]) throw new CustomError(`${ type } was nod defined for language ${ language } in notifyMessages object`);
        });
    })
}

export { validateNotifyMessages }
