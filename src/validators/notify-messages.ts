import { notifyMessages } from "../notify-messages";
import { CustomError } from "../core/custom-error";
import { customConfig } from "../config";

const validateNotifyMessages = () => {
    if (!Object.keys(notifyMessages).length) throw new CustomError("notifyMessages must have at least one entry");
    if (!notifyMessages[customConfig.notifyMessageLanguage]) throw new CustomError("notifyMessages doesn't have entry for language specified in customConfig", {
        "customConfig.notifyMessageLanguage": customConfig.notifyMessageLanguage
    })
}

export { validateNotifyMessages }
