import { PostSupervisor } from "../models/params/post-supervisor";
import { CustomError } from "../core/custom-error";

const validatePostSupervisorParams = (params: PostSupervisor) => {
    if (!params.id || (typeof params.id !== 'string' && typeof params.id !== 'number'))
        throw new CustomError("id is required and  must be string or number");

    if (!params.subscription || typeof params.subscription !== 'object')
        throw new CustomError("subscription is required and must be an object with webPush or firebase or both properties");

    if (!params.subscription.webPush && !params.subscription.firebase)
        throw new CustomError("At least one subscription is required for supervisor, standard VAPID web push subscription or Firebase token");
};

export { validatePostSupervisorParams }
