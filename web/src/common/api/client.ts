/**
 * @file Aki(): function to instantiate authentik OpenAPI connectors with configuration details
 */

import {
    CSRFMiddleware,
    DevRepeatedRequestsMiddleware,
    EventMiddleware,
    LocaleMiddleware,
    LoggingMiddleware,
} from "#common/api/middleware";
import { consoleRuntime } from "#common/console";
import { globalAK } from "#common/global";
import { PagePreparationMiddleware } from "#common/page-preparation";
import { SentryMiddleware } from "#common/sentry/middleware";

import { CapabilitiesEnum, Configuration, type Middleware } from "@goauthentik/api";

type APIConstructor<T> = new (config: Configuration) => T;

/*
 * Neither the Configuration or any APIConstructor has internal state. We cache them because re-use
 * is safe and performant.
 */

let configuration: Configuration | null = null;

const endpoints = new Map<APIConstructor<unknown>, unknown>();

let middleware: Middleware[] = [];

export function resetAPIClients(): void {
    for (const item of middleware) {
        if (Symbol.dispose in item) (item as Middleware & Disposable)[Symbol.dispose]();
    }

    middleware = [];
    endpoints.clear();
    configuration = null;
}

function apiConfiguration(): Configuration {
    if (!configuration) {
        const { locale, api, brand, config } = globalAK();
        const runtime = consoleRuntime();

        configuration = new Configuration({
            basePath: `${api.base}api/v3`,
            ...(runtime ? { accessToken: runtime.accessToken, credentials: "omit" as const } : {}),
            middleware: (middleware = [
                new CSRFMiddleware(),
                new EventMiddleware(),
                new LoggingMiddleware(brand),
                new SentryMiddleware(),
                new LocaleMiddleware(locale),
                ...(config.capabilities.includes(CapabilitiesEnum.CanDebug)
                    ? [new DevRepeatedRequestsMiddleware()]
                    : []),
                ...(runtime
                    ? [
                          {
                              pre: async ({ init, url }) => ({
                                  url,
                                  init: {
                                      ...init,
                                      signal: init.signal
                                          ? AbortSignal.any([init.signal, runtime.signal])
                                          : runtime.signal,
                                  },
                              }),
                          } satisfies Middleware,
                      ]
                    : []),
                new PagePreparationMiddleware(),
            ]),
        });

        Object.freeze(configuration);
    }

    return configuration;
}

export function aki<T>(APIClass: APIConstructor<T>): T {
    let endpoint = endpoints.get(APIClass) as T | undefined;

    if (!endpoint) {
        endpoint = new APIClass(apiConfiguration());
        endpoints.set(APIClass, endpoint);
    }

    return endpoint;
}

console.debug(`authentik(early): version ${import.meta.env.AK_VERSION}`);
