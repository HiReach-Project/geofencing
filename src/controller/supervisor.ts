import express from 'express';
import HandleHttp from "../core/handle-http";
import { set } from "../core/helpers";
import { PostSupervisor } from "../models/params/post-supervisor";
import { validatePostSupervisorParams } from "../validators/supervisor";
import { CustomResponse } from "../core/custom-response";

const router = express.Router();

router.post("", HandleHttp(async (request, response) => {
    const params: PostSupervisor = request.body;

    validatePostSupervisorParams(params);

    await set("supervisor", params.id, params.subscription);

    response.status(200);
    response.json(new CustomResponse("Supervisor added!"));
}));

export default router;
