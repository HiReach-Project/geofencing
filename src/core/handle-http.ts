import { Request, Response } from "express";

type HttpHandler = (request: Request, response: Response) => Promise<void>;

const HandleHttp = (cb: HttpHandler): HttpHandler => {
    return async function (request: Request, response: Response): Promise<void> {
        try {
            await cb(request, response);
        } catch (e) {
            response.status(400);
            response.json({ ok: false, error: e.message, data: e.data, stack: e.stack });
        }
    }
}

export default HandleHttp;
