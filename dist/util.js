"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const os = require("os");
const objectEntries = require("object.entries"); // tslint:disable-line:no-require-imports
const pkg = require('../package.json'); // tslint:disable-line:no-require-imports no-var-requires
/**
 * For when you need a function that does nothing
 */
function noop() { } // tslint:disable-line:no-empty
exports.noop = noop;
/**
 * Replaces occurences of '/' with ':' in a string, since '/' is meaningful inside User-Agent strings as a separator.
 */
function replaceSlashes(s) {
    return s.replace('/', ':');
}
const baseUserAgent = `${replaceSlashes(pkg.name)}/${pkg.version} ` +
    `node/${process.version.replace('v', '')} ` +
    `${os.platform()}/${os.release()}`;
const appMetadata = {};
/**
 * Appends the app metadata into the User-Agent value
 * @param appMetadata.name name of tool to be counted in instrumentation
 * @param appMetadata.version version of tool to be counted in instrumentation
 */
function addAppMetadata({ name, version }) {
    appMetadata[replaceSlashes(name)] = version;
}
exports.addAppMetadata = addAppMetadata;
/**
 * Returns the current User-Agent value for instrumentation
 */
function getUserAgent() {
    const appIdentifier = objectEntries(appMetadata).map(([name, version]) => `${name}/${version}`).join(' ');
    // only prepend the appIdentifier when its not empty
    return ((appIdentifier.length > 0) ? `${appIdentifier} ` : '') + baseUserAgent;
}
exports.getUserAgent = getUserAgent;
/**
 * Build a Promise that will resolve after the specified number of milliseconds.
 * @param ms milliseconds to wait
 * @param value value for eventual resolution
 */
function delay(ms, value) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(value), ms);
    });
}
exports.delay = delay;
/**
 * Reduce an asynchronous iterable into a single value.
 * @param iterable the async iterable to be reduced
 * @param callbackfn a function that implements one step of the reduction
 * @param initialValue the initial value for the accumulator
 */
function awaitAndReduce(iterable, callbackfn, initialValue) {
    var iterable_1, iterable_1_1;
    return __awaiter(this, void 0, void 0, function* () {
        var e_1, _a;
        // TODO: make initialValue optional (overloads or conditional types?)
        let accumulator = initialValue;
        try {
            for (iterable_1 = __asyncValues(iterable); iterable_1_1 = yield iterable_1.next(), !iterable_1_1.done;) {
                const value = iterable_1_1.value;
                accumulator = callbackfn(accumulator, value);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return)) yield _a.call(iterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return accumulator;
    });
}
exports.awaitAndReduce = awaitAndReduce;
// tslint:enable:max-line-length
/**
 * The following is a polyfill of Node >= 8.2.0's util.callbackify method. The source is copied (with some
 * modification) from:
 * https://github.com/nodejs/node/blob/bff5d5b8f0c462880ef63a396d8912d5188bbd31/lib/util.js#L1095-L1140
 * The modified parts are denoted using comments starting with `original` and ending with `modified`
 * This could really be made an independent module. It was suggested here: https://github.com/js-n/callbackify/issues/5
 */
// tslint:disable-next-line:typedef
exports.callbackify = util.callbackify !== undefined ? util.callbackify : function () {
    // Need polyfill of Object.getOwnPropertyDescriptors
    // tslint:disable
    require('object.getownpropertydescriptors').shim();
    // This function is a shallow stub of what the real function does, but we cannot import from `internal/errors`
    // @ts-ignore
    function makeNodeError(type, code) {
        const e = new type();
        e.code = code;
        return e;
    }
    // @ts-ignore
    function callbackifyOnRejected(reason, cb) {
        // `!reason` guard inspired by bluebird (Ref: https://goo.gl/t5IS6M).
        // Because `null` is a special error value in callbacks which means "no error
        // occurred", we error-wrap so the callback consumer can distinguish between
        // "the promise rejected with null" or "the promise fulfilled with undefined".
        if (!reason) {
            // original
            // const newReason = new errors.Error('FALSY_VALUE_REJECTION');
            // modified
            const newReason = makeNodeError(Error, 'FALSY_VALUE_REJECTION');
            newReason.reason = reason;
            reason = newReason;
            Error.captureStackTrace(reason, callbackifyOnRejected);
        }
        return cb(reason);
    }
    // @ts-ignore
    function callbackify(original) {
        if (typeof original !== 'function') {
            // original
            // throw new TypeError(
            //   'ERR_INVALID_ARG_TYPE',
            //   'original',
            //   'function');
            // modified
            throw makeNodeError(TypeError, 'ERR_INVALID_ARG_TYPE');
        }
        // We DO NOT return the promise as it gives the user a false sense that
        // the promise is actually somehow related to the callback's execution
        // and that the callback throwing will reject the promise.
        // @ts-ignore
        function callbackified(...args) {
            const maybeCb = args.pop();
            if (typeof maybeCb !== 'function') {
                // original
                // throw new errors.TypeError(
                //   'ERR_INVALID_ARG_TYPE',
                //   'last argument',
                //   'function');
                // modified
                throw makeNodeError(TypeError, 'ERR_INVALID_ARG_TYPE');
            }
            // @ts-ignore
            const cb = (...args) => { Reflect.apply(maybeCb, this, args); };
            // In true node style we process the callback on `nextTick` with all the
            // implications (stack, `uncaughtException`, `async_hooks`)
            // @ts-ignore
            Reflect.apply(original, this, args)
                // @ts-ignore
                .then((ret) => process.nextTick(cb, null, ret), 
            // @ts-ignore
            (rej) => process.nextTick(callbackifyOnRejected, rej, cb));
        }
        Object.setPrototypeOf(callbackified, Object.getPrototypeOf(original));
        Object.defineProperties(callbackified, 
        // @ts-ignore (installed with polyfill)
        Object.getOwnPropertyDescriptors(original));
        return callbackified;
    }
    // tslint:enable
    return callbackify;
}();
// tslint:enable:prefer-array-literal
//# sourceMappingURL=util.js.map