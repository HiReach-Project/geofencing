export class CustomError extends Error {

    constructor(message: string, public data: {} = {}) {
        super(message);
    }
}
