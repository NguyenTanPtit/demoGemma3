// Base Class
import {getUserMessage} from "./ErrorMessage.ts";

export class VSmartAPIException extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;
    }


    getUserMessage(): string |null {
        return getUserMessage(this.message)
    }
}



export class SystemError extends VSmartAPIException {
    constructor(public statusCode: number, public responseMessage?: string) {
        super(responseMessage);
    }
}

export class NoConnection extends VSmartAPIException {}
export class NoConnectionServer extends VSmartAPIException {}
export class Timeout extends VSmartAPIException {}

export class Unexpected extends VSmartAPIException {
    constructor(public responseMessage?: string) {
        super(responseMessage);
    }
}

export class General extends VSmartAPIException {
    constructor(public responseMessage?: string) {
        super(responseMessage);
    }
}

export class WrongPassword extends VSmartAPIException {
    constructor(public responseMessage?: string) {
        super(responseMessage);
    }
}

export class NotSupportedMethodException extends VSmartAPIException {
    constructor(public responseMessage: string) {
        super(responseMessage);
    }
}

export class CancellationException extends VSmartAPIException {}

export class GetAlertException extends VSmartAPIException {
    constructor(public errorCode: string, public responseMessage: string) {
        super(responseMessage);
    }
}

export class LockCellException extends VSmartAPIException {
    constructor(public errorMessage?: string) {
        super(errorMessage);
    }
}

export class GetCabinetException extends VSmartAPIException {
    constructor(public errorMessage?: string) {
        super(errorMessage);
    }
}

export class ValidateCellException extends VSmartAPIException {
    constructor(public errorMessage: string) {
        super(errorMessage);
    }
}

export class DataEmptyException extends VSmartAPIException {
    constructor(public errorMessage: string = "") {
        super(errorMessage);
    }
}

export class APINoDataException extends VSmartAPIException {
    constructor(public errorMessage?: string) {
        super(errorMessage);
    }
}