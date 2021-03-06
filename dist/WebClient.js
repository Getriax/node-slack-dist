"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
// polyfill for async iterable. see: https://stackoverflow.com/a/43694282/305340
if (Symbol['asyncIterator'] === undefined) {
    (Symbol['asyncIterator']) = Symbol.for('asyncIterator');
}
const querystring_1 = require("querystring");
const path_1 = require("path");
const objectEntries = require("object.entries"); // tslint:disable-line:no-require-imports
const isStream = require("is-stream"); // tslint:disable-line:no-require-imports
const EventEmitter = require("eventemitter3"); // tslint:disable-line:import-name no-require-imports
const PQueue = require("p-queue"); // tslint:disable-line:import-name no-require-imports
const pRetry = require("p-retry"); // tslint:disable-line:no-require-imports
const axios_1 = require("axios");
const FormData = require("form-data"); // tslint:disable-line:no-require-imports import-name
const util_1 = require("./util");
const errors_1 = require("./errors");
const logger_1 = require("./logger");
const retry_policies_1 = require("./retry-policies");
const methods = require("./methods"); // tslint:disable-line:import-name
const pkg = require('../package.json'); // tslint:disable-line:no-require-imports no-var-requires
/**
 * A client for Slack's Web API
 *
 * This client provides an alias for each {@link https://api.slack.com/methods|Web API method}. Each method is
 * a convenience wrapper for calling the {@link WebClient#apiCall} method using the method name as the first parameter.
 */
class WebClient extends EventEmitter {
    /**
     * @param token - An API token to authenticate/authorize with Slack (usually start with `xoxp`, `xoxb`, or `xoxa`)
     */
    constructor(token, { slackApiUrl = 'https://slack.com/api/', logger = undefined, logLevel = logger_1.LogLevel.INFO, maxRequestConcurrency = 3, retryConfig = retry_policies_1.default.retryForeverExponentialCappedRandom, agent = undefined, tls = undefined, pageSize = 200, rejectRateLimitedCalls = false, clientId = undefined, clientSecret = undefined, refreshToken = undefined, headers = {}, } = {}) {
        super();
        /**
         * Whether or not a token refresh is currently in progress
         * TODO: maybe this should be a Promise so that other API calls can await this and we don't fill the queue with
         * calls that are destined to fail.
         */
        this.isTokenRefreshing = false;
        /**
         * api method family
         */
        this.api = {
            test: (this.apiCall.bind(this, 'api.test')),
        };
        /**
         * apps method family
         */
        this.apps = {
            permissions: {
                info: (this.apiCall.bind(this, 'apps.permissions.info')),
                request: (this.apiCall.bind(this, 'apps.permissions.request')),
                resources: {
                    list: (this.apiCall.bind(this, 'apps.permissions.resources.list')),
                },
                scopes: {
                    list: (this.apiCall.bind(this, 'apps.permissions.scopes.list')),
                },
            },
        };
        /**
         * auth method family
         */
        this.auth = {
            revoke: (this.apiCall.bind(this, 'auth.revoke')),
            test: (this.apiCall.bind(this, 'auth.test')),
        };
        /**
         * bots method family
         */
        this.bots = {
            info: (this.apiCall.bind(this, 'bots.info')),
        };
        /**
         * channels method family
         */
        this.channels = {
            archive: (this.apiCall.bind(this, 'channels.archive')),
            create: (this.apiCall.bind(this, 'channels.create')),
            history: (this.apiCall.bind(this, 'channels.history')),
            info: (this.apiCall.bind(this, 'channels.info')),
            invite: (this.apiCall.bind(this, 'channels.invite')),
            join: (this.apiCall.bind(this, 'channels.join')),
            kick: (this.apiCall.bind(this, 'channels.kick')),
            leave: (this.apiCall.bind(this, 'channels.leave')),
            list: (this.apiCall.bind(this, 'channels.list')),
            mark: (this.apiCall.bind(this, 'channels.mark')),
            rename: (this.apiCall.bind(this, 'channels.rename')),
            replies: (this.apiCall.bind(this, 'channels.replies')),
            setPurpose: (this.apiCall.bind(this, 'channels.setPurpose')),
            setTopic: (this.apiCall.bind(this, 'channels.setTopic')),
            unarchive: (this.apiCall.bind(this, 'channels.unarchive')),
        };
        /**
         * chat method family
         */
        this.chat = {
            delete: (this.apiCall.bind(this, 'chat.delete')),
            getPermalink: (this.apiCall.bind(this, 'chat.getPermalink')),
            meMessage: (this.apiCall.bind(this, 'chat.meMessage')),
            postEphemeral: (this.apiCall.bind(this, 'chat.postEphemeral')),
            postMessage: (this.apiCall.bind(this, 'chat.postMessage')),
            unfurl: (this.apiCall.bind(this, 'chat.unfurl')),
            update: (this.apiCall.bind(this, 'chat.update')),
        };
        /**
         * conversations method family
         */
        this.conversations = {
            archive: (this.apiCall.bind(this, 'conversations.archive')),
            close: (this.apiCall.bind(this, 'conversations.close')),
            create: (this.apiCall.bind(this, 'conversations.create')),
            history: (this.apiCall.bind(this, 'conversations.history')),
            info: (this.apiCall.bind(this, 'conversations.info')),
            invite: (this.apiCall.bind(this, 'conversations.invite')),
            join: (this.apiCall.bind(this, 'conversations.join')),
            kick: (this.apiCall.bind(this, 'conversations.kick')),
            leave: (this.apiCall.bind(this, 'conversations.leave')),
            list: (this.apiCall.bind(this, 'conversations.list')),
            members: (this.apiCall.bind(this, 'conversations.members')),
            open: (this.apiCall.bind(this, 'conversations.open')),
            rename: (this.apiCall.bind(this, 'conversations.rename')),
            replies: (this.apiCall.bind(this, 'conversations.replies')),
            setPurpose: (this.apiCall.bind(this, 'conversations.setPurpose')),
            setTopic: (this.apiCall.bind(this, 'conversations.setTopic')),
            unarchive: (this.apiCall.bind(this, 'conversations.unarchive')),
        };
        /**
         * dialog method family
         */
        this.dialog = {
            open: (this.apiCall.bind(this, 'dialog.open')),
        };
        /**
         * dnd method family
         */
        this.dnd = {
            endDnd: (this.apiCall.bind(this, 'dnd.endDnd')),
            endSnooze: (this.apiCall.bind(this, 'dnd.endSnooze')),
            info: (this.apiCall.bind(this, 'dnd.info')),
            setSnooze: (this.apiCall.bind(this, 'dnd.setSnooze')),
            teamInfo: (this.apiCall.bind(this, 'dnd.teamInfo')),
        };
        /**
         * emoji method family
         */
        this.emoji = {
            list: (this.apiCall.bind(this, 'emoji.list')),
        };
        /**
         * files method family
         */
        this.files = {
            delete: (this.apiCall.bind(this, 'files.delete')),
            info: (this.apiCall.bind(this, 'files.info')),
            list: (this.apiCall.bind(this, 'files.list')),
            revokePublicURL: (this.apiCall.bind(this, 'files.revokePublicURL')),
            sharedPublicURL: (this.apiCall.bind(this, 'files.sharedPublicURL')),
            upload: (this.apiCall.bind(this, 'files.upload')),
            comments: {
                add: (this.apiCall.bind(this, 'files.comments.add')),
                delete: (this.apiCall.bind(this, 'files.comments.delete')),
                edit: (this.apiCall.bind(this, 'files.comments.edit')),
            },
        };
        /**
         * groups method family
         */
        this.groups = {
            archive: (this.apiCall.bind(this, 'groups.archive')),
            create: (this.apiCall.bind(this, 'groups.create')),
            createChild: (this.apiCall.bind(this, 'groups.createChild')),
            history: (this.apiCall.bind(this, 'groups.history')),
            info: (this.apiCall.bind(this, 'groups.info')),
            invite: (this.apiCall.bind(this, 'groups.invite')),
            kick: (this.apiCall.bind(this, 'groups.kick')),
            leave: (this.apiCall.bind(this, 'groups.leave')),
            list: (this.apiCall.bind(this, 'groups.list')),
            mark: (this.apiCall.bind(this, 'groups.mark')),
            open: (this.apiCall.bind(this, 'groups.open')),
            rename: (this.apiCall.bind(this, 'groups.rename')),
            replies: (this.apiCall.bind(this, 'groups.replies')),
            setPurpose: (this.apiCall.bind(this, 'groups.setPurpose')),
            setTopic: (this.apiCall.bind(this, 'groups.setTopic')),
            unarchive: (this.apiCall.bind(this, 'groups.unarchive')),
        };
        /**
         * im method family
         */
        this.im = {
            close: (this.apiCall.bind(this, 'im.close')),
            history: (this.apiCall.bind(this, 'im.history')),
            list: (this.apiCall.bind(this, 'im.list')),
            mark: (this.apiCall.bind(this, 'im.mark')),
            open: (this.apiCall.bind(this, 'im.open')),
            replies: (this.apiCall.bind(this, 'im.replies')),
        };
        /**
         * migration method family
         */
        this.migration = {
            exchange: (this.apiCall.bind(this, 'migration.exchange')),
        };
        /**
         * mpim method family
         */
        this.mpim = {
            close: (this.apiCall.bind(this, 'mpim.close')),
            history: (this.apiCall.bind(this, 'mpim.history')),
            list: (this.apiCall.bind(this, 'mpim.list')),
            mark: (this.apiCall.bind(this, 'mpim.mark')),
            open: (this.apiCall.bind(this, 'mpim.open')),
            replies: (this.apiCall.bind(this, 'mpim.replies')),
        };
        /**
         * oauth method family
         */
        this.oauth = {
            access: (this.apiCall.bind(this, 'oauth.access')),
            token: (this.apiCall.bind(this, 'oauth.token')),
        };
        /**
         * pins method family
         */
        this.pins = {
            add: (this.apiCall.bind(this, 'pins.add')),
            list: (this.apiCall.bind(this, 'pins.list')),
            remove: (this.apiCall.bind(this, 'pins.remove')),
        };
        /**
         * reactions method family
         */
        this.reactions = {
            add: (this.apiCall.bind(this, 'reactions.add')),
            get: (this.apiCall.bind(this, 'reactions.get')),
            list: (this.apiCall.bind(this, 'reactions.list')),
            remove: (this.apiCall.bind(this, 'reactions.remove')),
        };
        /**
         * reminders method family
         */
        this.reminders = {
            add: (this.apiCall.bind(this, 'reminders.add')),
            complete: (this.apiCall.bind(this, 'reminders.complete')),
            delete: (this.apiCall.bind(this, 'reminders.delete')),
            info: (this.apiCall.bind(this, 'reminders.info')),
            list: (this.apiCall.bind(this, 'reminders.list')),
        };
        /**
         * rtm method family
         */
        this.rtm = {
            connect: (this.apiCall.bind(this, 'rtm.connect')),
            start: (this.apiCall.bind(this, 'rtm.start')),
        };
        /**
         * search method family
         */
        this.search = {
            all: (this.apiCall.bind(this, 'search.all')),
            files: (this.apiCall.bind(this, 'search.files')),
            messages: (this.apiCall.bind(this, 'search.messages')),
        };
        /**
         * stars method family
         */
        this.stars = {
            add: (this.apiCall.bind(this, 'stars.add')),
            list: (this.apiCall.bind(this, 'stars.list')),
            remove: (this.apiCall.bind(this, 'stars.remove')),
        };
        /**
         * team method family
         */
        this.team = {
            accessLogs: (this.apiCall.bind(this, 'team.accessLogs')),
            billableInfo: (this.apiCall.bind(this, 'team.billableInfo')),
            info: (this.apiCall.bind(this, 'team.info')),
            integrationLogs: (this.apiCall.bind(this, 'team.integrationLogs')),
            profile: {
                get: (this.apiCall.bind(this, 'team.profile.get')),
            },
        };
        /**
         * usergroups method family
         */
        this.usergroups = {
            create: (this.apiCall.bind(this, 'usergroups.create')),
            disable: (this.apiCall.bind(this, 'usergroups.disable')),
            enable: (this.apiCall.bind(this, 'usergroups.enable')),
            list: (this.apiCall.bind(this, 'usergroups.list')),
            update: (this.apiCall.bind(this, 'usergroups.update')),
            users: {
                list: (this.apiCall.bind(this, 'usergroups.users.list')),
                update: (this.apiCall.bind(this, 'usergroups.users.update')),
            },
        };
        /**
         * users method family
         */
        this.users = {
            conversations: (this.apiCall.bind(this, 'users.conversations')),
            deletePhoto: (this.apiCall.bind(this, 'users.deletePhoto')),
            getPresence: (this.apiCall.bind(this, 'users.getPresence')),
            identity: (this.apiCall.bind(this, 'users.identity')),
            info: (this.apiCall.bind(this, 'users.info')),
            list: (this.apiCall.bind(this, 'users.list')),
            lookupByEmail: (this.apiCall.bind(this, 'users.lookupByEmail')),
            setActive: (this.apiCall.bind(this, 'users.setActive')),
            setPhoto: (this.apiCall.bind(this, 'users.setPhoto')),
            setPresence: (this.apiCall.bind(this, 'users.setPresence')),
            profile: {
                get: (this.apiCall.bind(this, 'users.profile.get')),
                set: (this.apiCall.bind(this, 'users.profile.set')),
            },
            prefs: {
                get: (this.apiCall.bind(this, 'users.prefs.get')),
                set: (this.apiCall.bind(this, 'users.prefs.set')),
            },
        };
        this._accessToken = token;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.refreshToken = refreshToken;
        this.slackApiUrl = slackApiUrl;
        this.retryConfig = retryConfig;
        this.requestQueue = new PQueue({ concurrency: maxRequestConcurrency });
        // NOTE: may want to filter the keys to only those acceptable for TLS options
        this.tlsConfig = tls !== undefined ? tls : {};
        this.pageSize = pageSize;
        this.rejectRateLimitedCalls = rejectRateLimitedCalls;
        // Logging
        if (logger !== undefined) {
            this.logger = logger_1.loggerFromLoggingFunc(WebClient.loggerName, logger);
        }
        else {
            this.logger = logger_1.getLogger(WebClient.loggerName);
        }
        this.logger.setLevel(logLevel);
        this.axios = axios_1.default.create({
            baseURL: slackApiUrl,
            headers: Object.assign({
                'User-Agent': util_1.getUserAgent(),
            }, headers),
            httpAgent: agentForScheme('http', agent),
            httpsAgent: agentForScheme('https', agent),
            transformRequest: [this.serializeApiCallOptions.bind(this)],
            validateStatus: () => true,
            maxRedirects: 0,
        });
        // serializeApiCallOptions will always determine the appropriate content-type
        delete this.axios.defaults.headers.post['Content-Type'];
        this.logger.debug('initialized');
    }
    /**
     * Authentication and authorization token for accessing Slack Web API (usually begins with `xoxa`, xoxp`, or `xoxb`)
     */
    get token() {
        return this._accessToken;
    }
    set token(newToken) {
        this.accessTokenExpiresAt = undefined;
        this.isTokenRefreshing = false;
        this._accessToken = newToken;
    }
    apiCall(method, options, callback) {
        this.logger.debug('apiCall() start');
        // The following thunk is the actual implementation for this method. It is wrapped so that it can be adapted for
        // different executions below.
        const implementation = () => __awaiter(this, void 0, void 0, function* () {
            if (typeof options === 'string' || typeof options === 'number' || typeof options === 'boolean') {
                throw new TypeError(`Expected an options argument but instead received a ${typeof options}`);
            }
            // warn for methods whose functionality is deprecated
            if (method === 'files.comments.add' || method === 'files.comments.edit') {
                this.logger.warn(`File comments are deprecated in favor of file threads. Replace uses of ${method} in your app ` +
                    'to take advantage of improvements. See https://api.slack.com/changelog/2018-05-file-threads-soon-tread ' +
                    'to learn more.');
            }
            // optimistically check for an expired access token, and refresh it if possible
            if ((method !== 'oauth.access' && method !== 'oauth.token') &&
                (options === undefined || !('token' in options)) &&
                this.shouldAutomaticallyRefreshToken &&
                (this.token === undefined ||
                    this.accessTokenExpiresAt !== undefined && this.accessTokenExpiresAt < Date.now())) {
                yield this.performTokenRefresh();
            }
            // build headers
            const headers = {};
            if (options !== undefined && optionsAreUserPerspectiveEnabled(options)) {
                headers['X-Slack-User'] = options.on_behalf_of;
                delete options.on_behalf_of;
            }
            const methodSupportsCursorPagination = methods.cursorPaginationEnabledMethods.has(method);
            const optionsPaginationType = getOptionsPaginationType(options);
            // warn in priority of most general pagination problem to most specific pagination problem
            if (optionsPaginationType === PaginationType.Mixed) {
                this.logger.warn('Options include mixed pagination techniques. ' +
                    'Always prefer cursor-based pagination when available');
            }
            else if (optionsPaginationType === PaginationType.Cursor &&
                !methodSupportsCursorPagination) {
                this.logger.warn('Options include cursor-based pagination while the method cannot support that technique');
            }
            else if (optionsPaginationType === PaginationType.Timeline &&
                !methods.timelinePaginationEnabledMethods.has(method)) {
                this.logger.warn('Options include timeline-based pagination while the method cannot support that technique');
            }
            else if (optionsPaginationType === PaginationType.Traditional &&
                !methods.traditionalPagingEnabledMethods.has(method)) {
                this.logger.warn('Options include traditional paging while the method cannot support that technique');
            }
            else if (methodSupportsCursorPagination &&
                optionsPaginationType !== PaginationType.Cursor && optionsPaginationType !== PaginationType.None) {
                this.logger.warn('Method supports cursor-based pagination and a different technique is used in options. ' +
                    'Always prefer cursor-based pagination when available');
            }
            const shouldAutoPaginate = methodSupportsCursorPagination && optionsPaginationType === PaginationType.None;
            this.logger.debug(`shouldAutoPaginate: ${shouldAutoPaginate}`);
            /**
             * Generates a result object for each of the HTTP requests for this API call. API calls will generally only
             * generate more than one result when automatic pagination is occurring.
             */
            function generateResults() {
                return __asyncGenerator(this, arguments, function* generateResults_1() {
                    // when result is undefined, that signals that the first of potentially many calls has not yet been made
                    let result = undefined;
                    // paginationOptions stores pagination options not already stored in the options argument
                    let paginationOptions = {};
                    if (shouldAutoPaginate) {
                        // these are the default pagination options
                        paginationOptions = { limit: this.pageSize };
                    }
                    while (result === undefined ||
                        (shouldAutoPaginate &&
                            (objectEntries(paginationOptions = paginationOptionsForNextPage(result, this.pageSize)).length > 0))) {
                        // NOTE: this is a really inelegant way of capturing the request time
                        let requestTime;
                        result = yield __await((this.makeRequest(method, Object.assign({ token: this._accessToken }, paginationOptions, options), headers)
                            .then((response) => {
                            requestTime = response.request[requestTimePropName];
                            const result = this.buildResult(response);
                            // log warnings in response metadata
                            if (result.response_metadata !== undefined && result.response_metadata.warnings !== undefined) {
                                result.response_metadata.warnings.forEach(this.logger.warn);
                            }
                            if (!result.ok) {
                                throw platformErrorFromResult(result);
                            }
                            return result;
                        })
                            // Automatic token refresh concerns
                            .catch((error) => __awaiter(this, void 0, void 0, function* () {
                            if (this.shouldAutomaticallyRefreshToken &&
                                error.code === errors_1.ErrorCode.PlatformError && error.data.error === 'invalid_auth') {
                                if (requestTime === undefined) {
                                    // TODO: create an inconsistent state error
                                    throw new Error('A logical error with tracking the request time occurred.');
                                }
                                if (this.accessTokenLastRefreshedAt === undefined) {
                                    if (!this.isTokenRefreshing) {
                                        yield this.performTokenRefresh();
                                        return implementation();
                                    }
                                    return implementation();
                                }
                                if (!this.isTokenRefreshing && requestTime > this.accessTokenLastRefreshedAt) {
                                    yield this.performTokenRefresh();
                                    return implementation();
                                }
                                return implementation();
                            }
                            throw error;
                        }))));
                        yield yield __await(result);
                    }
                });
            }
            // return a promise that resolves when a reduction of responses finishes
            return util_1.awaitAndReduce(generateResults.call(this), createResultMerger(method), {});
        });
        // Adapt the interface for callback-based execution or Promise-based execution
        if (callback !== undefined) {
            util_1.callbackify(implementation)(callback);
            return;
        }
        return implementation();
    }
    /**
     * Low-level function to make a single API request. handles queing, retries, and http-level errors
     */
    makeRequest(url, body, headers = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: better input types - remove any
            const task = () => this.requestQueue.add(() => __awaiter(this, void 0, void 0, function* () {
                this.logger.debug('will perform http request');
                try {
                    const requestTime = Date.now();
                    const response = yield this.axios.post(url, body, Object.assign({
                        headers,
                    }, this.tlsConfig));
                    response.request[requestTimePropName] = requestTime;
                    this.logger.debug('http response received');
                    if (response.status === 429) {
                        const retrySec = parseRetryHeaders(response);
                        if (retrySec !== undefined) {
                            this.emit('rate_limited', retrySec);
                            if (this.rejectRateLimitedCalls) {
                                throw new pRetry.AbortError(rateLimitedErrorWithDelay(retrySec));
                            }
                            this.logger.info(`API Call failed due to rate limiting. Will retry in ${retrySec} seconds.`);
                            // pause the request queue and then delay the rejection by the amount of time in the retry header
                            this.requestQueue.pause();
                            // NOTE: if there was a way to introspect the current RetryOperation and know what the next timeout
                            // would be, then we could subtract that time from the following delay, knowing that it the next
                            // attempt still wouldn't occur until after the rate-limit header has specified. an even better
                            // solution would be to subtract the time from only the timeout of this next attempt of the
                            // RetryOperation. this would result in the staying paused for the entire duration specified in the
                            // header, yet this operation not having to pay the timeout cost in addition to that.
                            yield util_1.delay(retrySec * 1000);
                            // resume the request queue and throw a non-abort error to signal a retry
                            this.requestQueue.start();
                            throw Error('A rate limit was exceeded.');
                        }
                        else {
                            // TODO: turn this into some CodedError
                            throw new pRetry.AbortError(new Error('Retry header did not contain a valid timeout.'));
                        }
                    }
                    // Slack's Web API doesn't use meaningful status codes besides 429 and 200
                    if (response.status !== 200) {
                        throw httpErrorFromResponse(response);
                    }
                    return response;
                }
                catch (error) {
                    this.logger.debug('http request failed');
                    if (error.request) {
                        throw requestErrorWithOriginal(error);
                    }
                    throw error;
                }
            }));
            return pRetry(task, this.retryConfig);
        });
    }
    /**
     * Transforms options (a simple key-value object) into an acceptable value for a body. This can be either
     * a string, used when posting with a content-type of url-encoded. Or, it can be a readable stream, used
     * when the options contain a binary (a stream or a buffer) and the upload should be done with content-type
     * multipart/form-data.
     *
     * @param options arguments for the Web API method
     * @param headers a mutable object representing the HTTP headers for the outgoing request
     */
    serializeApiCallOptions(options, headers) {
        // The following operation both flattens complex objects into a JSON-encoded strings and searches the values for
        // binary content
        let containsBinaryData = false;
        const flattened = objectEntries(options)
            .map(([key, value]) => {
            if (value === undefined || value === null) {
                return [];
            }
            let serializedValue = value;
            if (Buffer.isBuffer(value) || isStream(value)) {
                containsBinaryData = true;
            }
            else if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
                // if value is anything other than string, number, boolean, binary data, a Stream, or a Buffer, then encode it
                // as a JSON string.
                serializedValue = JSON.stringify(value);
            }
            return [key, serializedValue];
        });
        // A body with binary content should be serialized as multipart/form-data
        if (containsBinaryData) {
            this.logger.debug('request arguments contain binary data');
            const form = flattened.reduce((form, [key, value]) => {
                if (Buffer.isBuffer(value) || isStream(value)) {
                    const options = {};
                    options.filename = (() => {
                        // attempt to find filename from `value`. adapted from:
                        // tslint:disable-next-line:max-line-length
                        // https://github.com/form-data/form-data/blob/028c21e0f93c5fefa46a7bbf1ba753e4f627ab7a/lib/form_data.js#L227-L230
                        // formidable and the browser add a name property
                        // fs- and request- streams have path property
                        const streamOrBuffer = value;
                        if (typeof streamOrBuffer.name === 'string') {
                            return path_1.basename(streamOrBuffer.name);
                        }
                        if (typeof streamOrBuffer.path === 'string') {
                            return path_1.basename(streamOrBuffer.path);
                        }
                        return defaultFilename;
                    })();
                    form.append(key, value, options);
                }
                else if (key !== undefined && value !== undefined) {
                    form.append(key, value);
                }
                return form;
            }, new FormData());
            // Merge FormData provided headers into headers param
            // not reassigning to headers param since it is passed by reference and behaves as an inout param
            for (const [header, value] of objectEntries(form.getHeaders())) {
                headers[header] = value;
            }
            return form;
        }
        // Otherwise, a simple key-value object is returned
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        return querystring_1.stringify(flattened.reduce((accumulator, [key, value]) => {
            if (key !== undefined && value !== undefined) {
                accumulator[key] = value;
            }
            return accumulator;
        }, {}));
    }
    /**
     * Processes an HTTP response into a WebAPICallResult by performing JSON parsing on the body and merging relevent
     * HTTP headers into the object.
     * @param response - an http response
     */
    buildResult(response) {
        const data = response.data;
        // add scopes metadata from headers
        if (response.headers['x-oauth-scopes'] !== undefined) {
            data.scopes = response.headers['x-oauth-scopes'].trim().split(/\s*,\s*/);
        }
        if (response.headers['x-accepted-oauth-scopes'] !== undefined) {
            data.acceptedScopes = response.headers['x-accepted-oauth-scopes'].trim().split(/\s*,\s*/);
        }
        // add retry metadata from headers
        const retrySec = parseRetryHeaders(response);
        if (retrySec !== undefined) {
            data.retryAfter = retrySec;
        }
        return data;
    }
    /**
     * Determine if this client is in automatic token-refreshing mode
     */
    get shouldAutomaticallyRefreshToken() {
        return (this.clientId !== undefined && this.clientSecret !== undefined && this.refreshToken !== undefined);
    }
    /**
     * Perform a token refresh. Before calling this method, this.shouldAutomaticallyRefreshToken should be checked.
     *
     * This method avoids using `apiCall()` because that could infinitely recurse when that method determines that the
     * access token is already expired.
     */
    performTokenRefresh() {
        return __awaiter(this, void 0, void 0, function* () {
            let refreshResponse;
            try {
                // TODO: if we change isTokenRefreshing to a promise, we could await it here.
                this.isTokenRefreshing = true;
                refreshResponse = yield this.makeRequest('oauth.access', {
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                });
                if (!refreshResponse.data.ok) {
                    throw platformErrorFromResponse(refreshResponse);
                }
            }
            catch (error) {
                this.isTokenRefreshing = false;
                throw refreshFailedErrorWithOriginal(error);
            }
            this.isTokenRefreshing = false;
            this.accessTokenLastRefreshedAt = Date.now();
            this._accessToken = refreshResponse.data.access_token;
            this.accessTokenExpiresAt = Date.now() + (refreshResponse.data.expires_in * 1000);
            const tokenRefreshedEvent = {
                access_token: refreshResponse.data.access_token,
                expires_in: refreshResponse.data.expires_in,
                team_id: refreshResponse.data.team_id,
                enterprise_id: refreshResponse.data.enterprise_id,
            };
            this.emit('token_refreshed', tokenRefreshedEvent);
        });
    }
}
/**
 * The name used to prefix all logging generated from this object
 */
WebClient.loggerName = `${pkg.name}:WebClient`;
exports.WebClient = WebClient;
exports.default = WebClient;
/*
 * Helpers
 */
const defaultFilename = 'Untitled';
const requestTimePropName = 'slack_webclient_request_time';
/**
 * Detects whether an object is an http.Agent
 */
function isAgent(obj) {
    return typeof obj.maxSockets === 'number' && typeof obj.destroy === 'function';
}
/**
 * Returns an agent (or false or undefined) for the specific scheme and option passed in
 * @param scheme either 'http' or 'https'
 */
function agentForScheme(scheme, agentOption) {
    if (agentOption === undefined) {
        return undefined;
    }
    if (typeof agentOption === 'boolean') {
        return agentOption;
    }
    if (isAgent(agentOption)) {
        return agentOption;
    }
    return agentOption[scheme];
}
/**
 * Determines whether WebAPICallOptions conform to UserPerspectiveEnabled
 */
function optionsAreUserPerspectiveEnabled(options) {
    return options.on_behalf_of !== undefined;
}
/**
 * A factory to create WebAPIRequestError objects
 * @param original - original error
 */
function requestErrorWithOriginal(original) {
    const error = errors_1.errorWithCode(new Error(`A request error occurred: ${original.message}`), errors_1.ErrorCode.RequestError);
    error.original = original;
    return error;
}
/**
 * A factory to create WebAPIHTTPError objects
 * @param response - original error
 */
function httpErrorFromResponse(response) {
    const error = errors_1.errorWithCode(new Error(`An HTTP protocol error occurred: statusCode = ${response.status}`), errors_1.ErrorCode.HTTPError);
    error.original = new Error('The WebAPIHTTPError.original property is deprecated. See other properties for details.');
    error.statusCode = response.status;
    error.statusMessage = response.statusText;
    error.headers = response.headers;
    error.body = response.data;
    return error;
}
/**
 * A factory to create WebAPIPlatformError objects
 * @param result - Web API call result
 */
function platformErrorFromResult(result) {
    const error = errors_1.errorWithCode(new Error(`An API error occurred: ${result.error}`), errors_1.ErrorCode.PlatformError);
    error.data = result;
    return error;
}
/**
 * A factory to create WebAPIPlatformError objects
 * @param response - Axios response
 */
function platformErrorFromResponse(response) {
    const error = errors_1.errorWithCode(new Error(`An API error occurred: ${response.data.error}`), errors_1.ErrorCode.PlatformError);
    error.data = response.data;
    return error;
}
/**
 * A factory to create WebAPIRateLimitedError objects
 * @param retrySec - Number of seconds that the request can be retried in
 */
function rateLimitedErrorWithDelay(retrySec) {
    const error = errors_1.errorWithCode(new Error(`A rate-limit has been reached, you may retry this request in ${retrySec} seconds`), errors_1.ErrorCode.RateLimitedError);
    error.retryAfter = retrySec;
    return error;
}
/**
 * A factory to create WebAPIRefreshFailedError objects
 * @param original - Original error
 */
function refreshFailedErrorWithOriginal(original) {
    const error = errors_1.errorWithCode(new Error(`A token refresh error occurred: ${original.message}`), errors_1.ErrorCode.RefreshFailedError);
    error.original = original;
    return error;
}
var PaginationType;
(function (PaginationType) {
    PaginationType["Cursor"] = "Cursor";
    PaginationType["Timeline"] = "Timeline";
    PaginationType["Traditional"] = "Traditional";
    PaginationType["Mixed"] = "Mixed";
    PaginationType["None"] = "None";
})(PaginationType || (PaginationType = {}));
/**
 * Determines which pagination type, if any, the supplied options (a.k.a. method arguments) are using. This method is
 * also able to determine if the options have mixed different pagination types.
 */
function getOptionsPaginationType(options) {
    if (options === undefined) {
        return PaginationType.None;
    }
    let optionsType = PaginationType.None;
    for (const option of Object.keys(options)) {
        if (optionsType === PaginationType.None) {
            if (methods.cursorPaginationOptionKeys.has(option)) {
                optionsType = PaginationType.Cursor;
            }
            else if (methods.timelinePaginationOptionKeys.has(option)) {
                optionsType = PaginationType.Timeline;
            }
            else if (methods.traditionalPagingOptionKeys.has(option)) {
                optionsType = PaginationType.Traditional;
            }
        }
        else if (optionsType === PaginationType.Cursor) {
            if (methods.timelinePaginationOptionKeys.has(option) || methods.traditionalPagingOptionKeys.has(option)) {
                return PaginationType.Mixed;
            }
        }
        else if (optionsType === PaginationType.Timeline) {
            if (methods.cursorPaginationOptionKeys.has(option) || methods.traditionalPagingOptionKeys.has(option)) {
                return PaginationType.Mixed;
            }
        }
        else if (optionsType === PaginationType.Traditional) {
            if (methods.cursorPaginationOptionKeys.has(option) || methods.timelinePaginationOptionKeys.has(option)) {
                return PaginationType.Mixed;
            }
        }
    }
    return optionsType;
}
/**
 * Creates a function that can reduce a result into an accumulated result. This is used for reducing many results from
 * automatically paginated API calls into a single result. It depends on metadata in the 'method' import.
 * @param method - the API method for which a result merging function is needed
 */
function createResultMerger(method) {
    if (methods.cursorPaginationEnabledMethods.has(method)) {
        const paginatedResponseProperty = methods.cursorPaginationEnabledMethods.get(method);
        return (accumulator, result) => {
            for (const resultProperty of Object.keys(result)) {
                if (resultProperty === paginatedResponseProperty) {
                    if (accumulator[resultProperty] === undefined) {
                        accumulator[resultProperty] = [];
                    }
                    accumulator[resultProperty] = accumulator[resultProperty].concat(result[resultProperty]);
                }
                else {
                    accumulator[resultProperty] = result[resultProperty];
                }
            }
            return accumulator;
        };
    }
    // For all methods who don't use cursor-pagination, return the identity reduction function
    return (_, result) => result;
}
/**
 * Determines an appropriate set of cursor pagination options for the next request to a paginated API method.
 * @param previousResult - the result of the last request, where the next cursor might be found.
 * @param pageSize - the maximum number of additional items to fetch in the next request.
 */
function paginationOptionsForNextPage(previousResult, pageSize) {
    const paginationOptions = {};
    if (previousResult.response_metadata !== undefined &&
        previousResult.response_metadata.next_cursor !== undefined &&
        previousResult.response_metadata.next_cursor !== '') {
        paginationOptions.limit = pageSize;
        paginationOptions.cursor = previousResult.response_metadata.next_cursor;
    }
    return paginationOptions;
}
/**
 * Extract the amount of time (in seconds) the platform has recommended this client wait before sending another request
 * from a rate-limited HTTP response (statusCode = 429).
 */
function parseRetryHeaders(response) {
    if (response.headers['retry-after'] !== undefined) {
        return parseInt(response.headers['retry-after'], 10);
    }
    return undefined;
}
//# sourceMappingURL=WebClient.js.map