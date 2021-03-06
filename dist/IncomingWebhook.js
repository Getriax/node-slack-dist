"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const errors_1 = require("./errors");
const util_1 = require("./util");
/**
 * A client for Slack's Incoming Webhooks
 */
class IncomingWebhook {
    constructor(url, defaults = {}) {
        if (url === undefined) {
            throw new Error('Incoming webhook URL is required');
        }
        this.url = url;
        this.defaults = defaults;
    }
    send(message, callback) {
        // NOTE: no support for proxy
        // NOTE: no support for TLS config
        let payload = Object.assign({}, this.defaults);
        if (typeof message === 'string') {
            payload.text = message;
        }
        else {
            payload = Object.assign(payload, message);
        }
        const implementation = () => axios_1.default.post(this.url, payload)
            .catch((error) => {
            // Wrap errors in this packages own error types (abstract the implementation details' types)
            if (error.response !== undefined) {
                throw httpErrorWithOriginal(error);
            }
            else if (error.request !== undefined) {
                throw requestErrorWithOriginal(error);
            }
            else {
                throw error;
            }
        })
            .then((response) => {
            return this.buildResult(response);
        });
        if (callback !== undefined) {
            util_1.callbackify(implementation)(callback);
            return;
        }
        return implementation();
    }
    /**
     * Processes an HTTP response into an IncomingWebhookResult.
     */
    buildResult(response) {
        return {
            text: response.data,
        };
    }
}
exports.IncomingWebhook = IncomingWebhook;
/*
 * Helpers
 */
/**
 * A factory to create IncomingWebhookRequestError objects
 * @param original The original error
 */
function requestErrorWithOriginal(original) {
    const error = errors_1.errorWithCode(new Error(`A request error occurred: ${original.message}`), errors_1.ErrorCode.IncomingWebhookRequestError);
    error.original = original;
    return error;
}
/**
 * A factory to create IncomingWebhookHTTPError objects
 * @param original The original error
 */
function httpErrorWithOriginal(original) {
    const error = errors_1.errorWithCode(
    // `any` cast is used because the got definition file doesn't export the got.HTTPError type
    new Error(`An HTTP protocol error occurred: statusCode = ${original.statusCode}`), errors_1.ErrorCode.IncomingWebhookHTTPError);
    error.original = original;
    return error;
}
//# sourceMappingURL=IncomingWebhook.js.map