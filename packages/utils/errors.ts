import { Mode } from '../core/src/JWEditor';

/**
 * Creates an instance representing a custom error adapting to the constructor
 * name of the custom error and taking advantage of `captureStackTrace` of V8.
 *
 * Source:
 * http://developer.mozilla.org/docs/JavaScript/Reference/Global_Objects/Error
 */
export class CustomError extends Error {
    constructor(...params) {
        super(...params);
        this.name = this.constructor.name;

        // Maintains proper stack trace for where our error was thrown.
        if (Error.captureStackTrace) {
            // This is only available on V8.
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

/**
 * Creates an instance representing an error that occurs when a function only
 * allowed to be called in a specific mode is called in a different mode.
 */
export class ModeError extends CustomError {
    constructor(mode: Mode, ...params) {
        super(...params);
        this.message = `This operation is only allowed in ${mode} mode.`;
    }
}
