/// <reference types="node" />
import { IncomingHttpHeaders } from 'http';
import EventEmitter = require('eventemitter3');
import { AgentOption, TLSOptions } from './util';
import { CodedError, ErrorCode } from './errors';
import { LogLevel, LoggingFunc } from './logger';
import { RetryOptions } from './retry-policies';
import Method, * as methods from './methods';
/**
 * A client for Slack's Web API
 *
 * This client provides an alias for each {@link https://api.slack.com/methods|Web API method}. Each method is
 * a convenience wrapper for calling the {@link WebClient#apiCall} method using the method name as the first parameter.
 */
export declare class WebClient extends EventEmitter {
    /**
     * Authentication and authorization token for accessing Slack Web API (usually begins with `xoxa`, xoxp`, or `xoxb`)
     */
    token: string | undefined;
    /**
     * OAuth 2.0 refresh token used to automatically create new access tokens (`token`) when the current is expired.
     */
    readonly refreshToken?: string;
    /**
     * OAuth 2.0 client identifier
     */
    readonly clientId?: string;
    /**
     * OAuth 2.0 client secret
     */
    readonly clientSecret?: string;
    /**
     * The base URL for reaching Slack's Web API. Consider changing this value for testing purposes.
     */
    readonly slackApiUrl: string;
    /**
     * The backing store for the current access token.
     */
    private _accessToken?;
    /**
     * The time (in milliseconds) when the current access token will expire
     */
    private accessTokenExpiresAt?;
    /**
     * Whether or not a token refresh is currently in progress
     * TODO: maybe this should be a Promise so that other API calls can await this and we don't fill the queue with
     * calls that are destined to fail.
     */
    private isTokenRefreshing;
    /**
     * The time (in milliseconds) when the last token refresh completed
     */
    private accessTokenLastRefreshedAt?;
    /**
     * Configuration for retry operations. See {@link https://github.com/tim-kos/node-retry|node-retry} for more details.
     */
    private retryConfig;
    /**
     * Queue of requests in which a maximum of {@link WebClientOptions.maxRequestConcurrency} can concurrently be
     * in-flight.
     */
    private requestQueue;
    /**
     * Axios HTTP client instance used by this client
     */
    private axios;
    /**
     * Configuration for custom TLS handling
     */
    private tlsConfig;
    /**
     * Automatic pagination page size (limit)
     */
    private pageSize;
    /**
     * Preference for immediately rejecting API calls which result in a rate-limited response
     */
    private rejectRateLimitedCalls;
    /**
     * The name used to prefix all logging generated from this object
     */
    private static loggerName;
    /**
     * This object's logger instance
     */
    private logger;
    /**
     * @param token - An API token to authenticate/authorize with Slack (usually start with `xoxp`, `xoxb`, or `xoxa`)
     */
    constructor(token?: string, { slackApiUrl, logger, logLevel, maxRequestConcurrency, retryConfig, agent, tls, pageSize, rejectRateLimitedCalls, clientId, clientSecret, refreshToken, headers, }?: WebClientOptions);
    /**
     * Generic method for calling a Web API method
     *
     * @param method the Web API method to call {@see https://api.slack.com/methods}
     * @param options options
     * @param callback callback if you don't want a promise returned
     */
    apiCall(method: string, options?: WebAPICallOptions): Promise<WebAPICallResult>;
    apiCall(method: string, options: WebAPICallOptions, callback: WebAPIResultCallback): void;
    /**
     * api method family
     */
    readonly api: {
        test: Method<methods.APITestArguments>;
    };
    /**
     * apps method family
     */
    readonly apps: {
        permissions: {
            info: Method<methods.TokenOverridable>;
            request: Method<methods.AppsPermissionsRequestArguments>;
            resources: {
                list: Method<methods.AppsPermissionsResourcesListArguments>;
            };
            scopes: {
                list: Method<methods.TokenOverridable>;
            };
        };
    };
    /**
     * auth method family
     */
    readonly auth: {
        revoke: Method<methods.AuthRevokeArguments>;
        test: Method<methods.TokenOverridable>;
    };
    /**
     * bots method family
     */
    readonly bots: {
        info: Method<methods.BotsInfoArguments>;
    };
    /**
     * channels method family
     */
    readonly channels: {
        archive: Method<methods.ChannelsArchiveArguments>;
        create: Method<methods.ChannelsCreateArguments>;
        history: Method<methods.ChannelsHistoryArguments>;
        info: Method<methods.ChannelsInfoArguments>;
        invite: Method<methods.ChannelsInviteArguments>;
        join: Method<methods.ChannelsJoinArguments>;
        kick: Method<methods.ChannelsKickArguments>;
        leave: Method<methods.ChannelsLeaveArguments>;
        list: Method<methods.ChannelsListArguments>;
        mark: Method<methods.ChannelsMarkArguments>;
        rename: Method<methods.ChannelsRenameArguments>;
        replies: Method<methods.ChannelsRepliesArguments>;
        setPurpose: Method<methods.ChannelsSetPurposeArguments>;
        setTopic: Method<methods.ChannelsSetTopicArguments>;
        unarchive: Method<methods.ChannelsUnarchiveArguments>;
    };
    /**
     * chat method family
     */
    readonly chat: {
        delete: Method<methods.ChatDeleteArguments>;
        getPermalink: Method<methods.ChatGetPermalinkArguments>;
        meMessage: Method<methods.ChatMeMessageArguments>;
        postEphemeral: Method<methods.ChatPostEphemeralArguments>;
        postMessage: Method<methods.ChatPostMessageArguments>;
        unfurl: Method<methods.ChatUnfurlArguments>;
        update: Method<methods.ChatUpdateArguments>;
    };
    /**
     * conversations method family
     */
    readonly conversations: {
        archive: Method<methods.ConversationsArchiveArguments>;
        close: Method<methods.ConversationsCloseArguments>;
        create: Method<methods.ConversationsCreateArguments>;
        history: Method<methods.ConversationsHistoryArguments>;
        info: Method<methods.ConversationsInfoArguments>;
        invite: Method<methods.ConversationsInviteArguments>;
        join: Method<methods.ConversationsJoinArguments>;
        kick: Method<methods.ConversationsKickArguments>;
        leave: Method<methods.ConversationsLeaveArguments>;
        list: Method<methods.ConversationsListArguments>;
        members: Method<methods.ConversationsMembersArguments>;
        open: Method<methods.ConversationsOpenArguments>;
        rename: Method<methods.ConversationsRenameArguments>;
        replies: Method<methods.ConversationsRepliesArguments>;
        setPurpose: Method<methods.ConversationsSetPurposeArguments>;
        setTopic: Method<methods.ConversationsSetTopicArguments>;
        unarchive: Method<methods.ConversationsUnarchiveArguments>;
    };
    /**
     * dialog method family
     */
    readonly dialog: {
        open: Method<methods.DialogOpenArguments>;
    };
    /**
     * dnd method family
     */
    readonly dnd: {
        endDnd: Method<methods.DndEndDndArguments>;
        endSnooze: Method<methods.DndEndDndArguments>;
        info: Method<methods.DndInfoArguments>;
        setSnooze: Method<methods.DndSetSnoozeArguments>;
        teamInfo: Method<methods.DndTeamInfoArguments>;
    };
    /**
     * emoji method family
     */
    readonly emoji: {
        list: Method<methods.TokenOverridable>;
    };
    /**
     * files method family
     */
    readonly files: {
        delete: Method<methods.FilesDeleteArguments>;
        info: Method<methods.FilesInfoArguments>;
        list: Method<methods.FilesListArguments>;
        revokePublicURL: Method<methods.FilesRevokePublicURLArguments>;
        sharedPublicURL: Method<methods.FilesSharedPublicURLArguments>;
        upload: Method<methods.FilesUploadArguments>;
        comments: {
            add: Method<methods.FilesCommentsAddArguments>;
            delete: Method<methods.FilesCommentsDeleteArguments>;
            edit: Method<methods.FilesCommentsEditArguments>;
        };
    };
    /**
     * groups method family
     */
    readonly groups: {
        archive: Method<methods.GroupsArchiveArguments>;
        create: Method<methods.GroupsCreateArguments>;
        createChild: Method<methods.GroupsCreateChildArguments>;
        history: Method<methods.GroupsHistoryArguments>;
        info: Method<methods.GroupsInfoArguments>;
        invite: Method<methods.GroupsInviteArguments>;
        kick: Method<methods.GroupsKickArguments>;
        leave: Method<methods.GroupsLeaveArguments>;
        list: Method<methods.GroupsListArguments>;
        mark: Method<methods.GroupsMarkArguments>;
        open: Method<methods.GroupsOpenArguments>;
        rename: Method<methods.GroupsRenameArguments>;
        replies: Method<methods.GroupsRepliesArguments>;
        setPurpose: Method<methods.GroupsSetPurposeArguments>;
        setTopic: Method<methods.GroupsSetTopicArguments>;
        unarchive: Method<methods.GroupsUnarchiveArguments>;
    };
    /**
     * im method family
     */
    readonly im: {
        close: Method<methods.IMCloseArguments>;
        history: Method<methods.IMHistoryArguments>;
        list: Method<methods.AppsPermissionsResourcesListArguments>;
        mark: Method<methods.IMMarkArguments>;
        open: Method<methods.IMOpenArguments>;
        replies: Method<methods.IMRepliesArguments>;
    };
    /**
     * migration method family
     */
    readonly migration: {
        exchange: Method<methods.MigrationExchangeArguments>;
    };
    /**
     * mpim method family
     */
    readonly mpim: {
        close: Method<methods.MPIMCloseArguments>;
        history: Method<methods.MPIMHistoryArguments>;
        list: Method<methods.AppsPermissionsResourcesListArguments>;
        mark: Method<methods.MPIMMarkArguments>;
        open: Method<methods.MPIMOpenArguments>;
        replies: Method<methods.MPIMRepliesArguments>;
    };
    /**
     * oauth method family
     */
    readonly oauth: {
        access: Method<methods.OAuthAccessArguments>;
        token: Method<methods.OAuthTokenArguments>;
    };
    /**
     * pins method family
     */
    readonly pins: {
        add: Method<methods.PinsAddArguments>;
        list: Method<methods.PinsListArguments>;
        remove: Method<methods.PinsRemoveArguments>;
    };
    /**
     * reactions method family
     */
    readonly reactions: {
        add: Method<methods.ReactionsAddArguments>;
        get: Method<methods.ReactionsGetArguments>;
        list: Method<methods.ReactionsListArguments>;
        remove: Method<methods.ReactionsRemoveArguments>;
    };
    /**
     * reminders method family
     */
    readonly reminders: {
        add: Method<methods.RemindersAddArguments>;
        complete: Method<methods.RemindersCompleteArguments>;
        delete: Method<methods.RemindersDeleteArguments>;
        info: Method<methods.RemindersInfoArguments>;
        list: Method<methods.DndEndDndArguments>;
    };
    /**
     * rtm method family
     */
    readonly rtm: {
        connect: Method<methods.RTMConnectArguments>;
        start: Method<methods.RTMStartArguments>;
    };
    /**
     * search method family
     */
    readonly search: {
        all: Method<methods.SearchAllArguments>;
        files: Method<methods.SearchAllArguments>;
        messages: Method<methods.SearchAllArguments>;
    };
    /**
     * stars method family
     */
    readonly stars: {
        add: Method<methods.StarsAddArguments>;
        list: Method<methods.StarsListArguments>;
        remove: Method<methods.StarsRemoveArguments>;
    };
    /**
     * team method family
     */
    readonly team: {
        accessLogs: Method<methods.TeamAccessLogsArguments>;
        billableInfo: Method<methods.TeamBillableInfoArguments>;
        info: Method<methods.TokenOverridable>;
        integrationLogs: Method<methods.TeamIntegrationLogsArguments>;
        profile: {
            get: Method<methods.TeamProfileGetArguments>;
        };
    };
    /**
     * usergroups method family
     */
    readonly usergroups: {
        create: Method<methods.UsergroupsCreateArguments>;
        disable: Method<methods.UsergroupsDisableArguments>;
        enable: Method<methods.UsergroupsEnableArguments>;
        list: Method<methods.UsergroupsListArguments>;
        update: Method<methods.UsergroupsUpdateArguments>;
        users: {
            list: Method<methods.UsergroupsUsersListArguments>;
            update: Method<methods.UsergroupsUsersUpdateArguments>;
        };
    };
    /**
     * users method family
     */
    readonly users: {
        conversations: Method<methods.UsersConversationsArguments>;
        deletePhoto: Method<methods.TokenOverridable>;
        getPresence: Method<methods.UsersGetPresenceArguments>;
        identity: Method<methods.DndEndDndArguments>;
        info: Method<methods.UsersInfoArguments>;
        list: Method<methods.UsersListArguments>;
        lookupByEmail: Method<methods.UsersLookupByEmailArguments>;
        setActive: Method<methods.TokenOverridable>;
        setPhoto: Method<methods.UsersSetPhotoArguments>;
        setPresence: Method<methods.UsersSetPresenceArguments>;
        profile: {
            get: Method<methods.UsersProfileGetArguments>;
            set: Method<methods.UsersProfileSetArguments>;
        };
        prefs: {
            get: Method<methods.UsersPrefsGetArguments>;
            set: Method<methods.UsersPrefsSetArguments>;
        };
    };
    /**
     * Low-level function to make a single API request. handles queing, retries, and http-level errors
     */
    private makeRequest;
    /**
     * Transforms options (a simple key-value object) into an acceptable value for a body. This can be either
     * a string, used when posting with a content-type of url-encoded. Or, it can be a readable stream, used
     * when the options contain a binary (a stream or a buffer) and the upload should be done with content-type
     * multipart/form-data.
     *
     * @param options arguments for the Web API method
     * @param headers a mutable object representing the HTTP headers for the outgoing request
     */
    private serializeApiCallOptions;
    /**
     * Processes an HTTP response into a WebAPICallResult by performing JSON parsing on the body and merging relevent
     * HTTP headers into the object.
     * @param response - an http response
     */
    private buildResult;
    /**
     * Determine if this client is in automatic token-refreshing mode
     */
    private readonly shouldAutomaticallyRefreshToken;
    /**
     * Perform a token refresh. Before calling this method, this.shouldAutomaticallyRefreshToken should be checked.
     *
     * This method avoids using `apiCall()` because that could infinitely recurse when that method determines that the
     * access token is already expired.
     */
    private performTokenRefresh;
}
export default WebClient;
export interface WebClientOptions {
    slackApiUrl?: string;
    logger?: LoggingFunc;
    logLevel?: LogLevel;
    maxRequestConcurrency?: number;
    retryConfig?: RetryOptions;
    agent?: AgentOption;
    tls?: TLSOptions;
    pageSize?: number;
    rejectRateLimitedCalls?: boolean;
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    headers?: object;
}
export interface WebAPICallOptions {
}
export interface WebAPICallResult {
    ok: boolean;
    error?: string;
    scopes?: string[];
    acceptedScopes?: string[];
    retryAfter?: number;
    response_metadata?: {
        warnings?: string[];
        next_cursor?: string;
    };
}
export interface WebAPIResultCallback {
    (error: WebAPICallError, result: WebAPICallResult): void;
}
export declare type WebAPICallError = WebAPIPlatformError | WebAPIRequestError | WebAPIReadError | WebAPIHTTPError | WebAPIRateLimitedError | WebAPIRefreshFailedError;
export interface WebAPIPlatformError extends CodedError {
    code: ErrorCode.PlatformError;
    data: WebAPICallResult & {
        error: string;
    };
}
export interface WebAPIRequestError extends CodedError {
    code: ErrorCode.RequestError;
    original: Error;
}
export interface WebAPIReadError extends CodedError {
    code: ErrorCode.ReadError;
    original: Error;
}
export interface WebAPIHTTPError extends CodedError {
    code: ErrorCode.HTTPError;
    original: Error;
    statusCode: number;
    statusMessage: string;
    headers: IncomingHttpHeaders;
    body?: any;
}
export interface WebAPIRateLimitedError extends CodedError {
    code: ErrorCode.RateLimitedError;
    retryAfter: number;
}
export interface WebAPIRefreshFailedError extends CodedError {
    code: ErrorCode.RefreshFailedError;
    original: Error;
}
export interface TokenRefreshedEvent {
    access_token: string;
    expires_in: number;
    team_id: string;
    enterprise_id?: string;
}
