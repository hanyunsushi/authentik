/**
 * @file Path-router outlet for the new route table.
 *   Renders the route matched from `location.pathname` (with the interface
 *   `prefix` stripped per the matcher's leading-slash contract), owns the
 *   loading and error states, and claims in-interface anchor clicks. Ships
 *   inert: nothing imports it until the interface flip in Plan 3b.
 *   App-context-free: imports only the router core, the reused 404/empty-state
 *   elements, `AKElement`, lit, `@sentry/browser` (plus the leaf
 *   `sentry/tracing` predicate), and `@lit/localize`.
 */

import "#elements/router/Router404";
import "#elements/EmptyState";
import "#elements/Spinner";
import { PagePreparation, nextPaint, waitForPage } from "#common/page-preparation";
import { sentryReporting } from "#common/sentry/tracing";

import { AKElement } from "#elements/Base";
import { getRouterConfig } from "#elements/router/core/config";
import { applyHashRedirect } from "#elements/router/core/hash-shim";
import { matchRoute, type RouteMatch, sameRouteMatch } from "#elements/router/core/matcher";
import {
    createClickInterceptor,
    navigate,
    RouterNavigateEvent,
} from "#elements/router/core/navigation";
import { joinPath, stripPrefix, stripTrailingSlash } from "#elements/router/core/paths";
import { type RouteLike } from "#elements/router/core/Route";
import { routedTabBaseContext } from "#elements/tabs/tab-context";
import { type SlottedTemplateResult } from "#elements/types";

import {
    getClient,
    SEMANTIC_ATTRIBUTE_SENTRY_SOURCE,
    type Span,
    startBrowserTracingNavigationSpan,
    startBrowserTracingPageLoadSpan,
} from "@sentry/browser";

import { ContextProvider } from "@lit/context";
import { msg } from "@lit/localize";
import { html, type PropertyValues, type TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

/**
 * Build a Sentry span name by joining the interface `prefix` to the matched
 * route `name` with exactly one slash — a bare name (`"library"`) and a
 * default-route name that carries its own leading slash (`"/x"`) both yield a
 * single separator. A `null` name (the 404 / unmatched branch) passes the raw
 * `pathname` through unchanged.
 */
export function formatSpanName(prefix: string, routeName: string | null, pathname: string): string {
    if (routeName === null) return pathname;

    return joinPath(prefix, routeName);
}

@customElement("ak-router-view")
export class RouterView extends AKElement {
    /**
     * Render into the light DOM so PatternFly page styles cascade and the 404 /
     * empty-state children resolve normally. Mirrors the legacy outlet.
     */
    protected override createRenderRoot() {
        return this;
    }

    public override role = "presentation";

    //#region Properties

    @property({ attribute: false })
    public routes: RouteLike[] = [];

    @property({ type: String })
    public prefix = "";

    @property({ type: String, attribute: "default-path" })
    public defaultPath = "/";

    @state()
    private current: RouteMatch<RouteLike> | null = null;

    @state() private content: SlottedTemplateResult = null;
    @state() private phase: "preparing" | "entering" | "ready" = "preparing";
    @state() private loaderPosition = { left: "50%", top: "50%" };
    #preparation?: PagePreparation;
    #animations: Animation[] = [];
    #positionObserver = new ResizeObserver(() => this.#positionLoader());
    #positionLoader = () => {
        const rect = this.getBoundingClientRect();
        const left = Math.max(0, rect.left);
        const right = Math.min(innerWidth, rect.right);
        const top = Math.max(64, rect.top);

        this.loaderPosition = {
            left: `${(left + right) / 2}px`,
            top: `${(top + innerHeight) / 2}px`,
        };
    };

    //#endregion

    //#region Sentry

    #sentryClient = getClient();
    #pageLoadSpan: Span | null = null;

    /**
     * Publishes the current page's mount path to routed `<ak-tabs>` descendants.
     */
    #tabBaseProvider = new ContextProvider(this, {
        context: routedTabBaseContext,
        initialValue: "",
    });

    constructor() {
        super();

        if (this.#sentryClient && sentryReporting(this.#sentryClient)) {
            this.#pageLoadSpan =
                startBrowserTracingPageLoadSpan(this.#sentryClient, {
                    name: window.location.pathname,
                    attributes: {
                        [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "url",
                    },
                }) ?? null;
        }
    }

    //#endregion

    //#region Lifecycle

    #clickHandler = createClickInterceptor(
        () => {
            const { base, interfaceName } = getRouterConfig();

            return {
                origin: window.location.origin,
                base,
                interfaceName,
                currentPathname: window.location.pathname,
                currentSearch: window.location.search,
            };
        },
        (url) => navigate(url),
    );

    #onPopState = (): void => this.#syncRoute();
    #onNavigate = (): void => this.#syncRoute();

    public override connectedCallback(): void {
        super.connectedCallback();

        window.addEventListener("popstate", this.#onPopState);
        window.addEventListener(RouterNavigateEvent.eventName, this.#onNavigate);
        document.addEventListener("click", this.#clickHandler, { capture: true });

        this.#positionObserver.observe(this);
        window.addEventListener("resize", this.#positionLoader);
        window.addEventListener("scroll", this.#positionLoader, { passive: true });
        applyHashRedirect();
        this.#syncRoute();
    }

    public override disconnectedCallback(): void {
        window.removeEventListener("popstate", this.#onPopState);
        window.removeEventListener(RouterNavigateEvent.eventName, this.#onNavigate);
        document.removeEventListener("click", this.#clickHandler, { capture: true });

        this.#preparation?.dispose();
        this.#animations.forEach((animation) => animation.cancel());
        this.#positionObserver.disconnect();
        window.removeEventListener("resize", this.#positionLoader);
        window.removeEventListener("scroll", this.#positionLoader);
        super.disconnectedCallback();
    }

    //#endregion

    //#region Matching

    /**
     * Strip this outlet's prefix. Paths outside the prefix are returned unchanged.
     */
    #strip(pathname: string): string {
        return stripPrefix(pathname, this.prefix);
    }

    /**
     * Join a route-relative path onto the prefix for navigation, normalizing to
     * exactly one separator regardless of whether the prefix ends in a slash.
     */
    #join(path: string): string {
        return joinPath(this.prefix, path);
    }

    /**
     * The absolute path consumed to reach a match, excluding its wildcard tail —
     * the mount path a tabbed page hands to its nested outlet. `/settings` and
     * `/settings/sessions` (a subtree route) both resolve to base
     * `/if/user/settings`; the tail (`sessions`) belongs to the nested outlet.
     */
    #basePath(match: RouteMatch<RouteLike>): string {
        const tail = match.parameters["0"];

        if (tail === undefined) return this.#join(match.pathname);

        const consumed = match.pathname.slice(0, match.pathname.length - tail.length);

        return this.#join(stripTrailingSlash(consumed) || "/");
    }

    #syncRoute = (): void => {
        let stripped = this.#strip(window.location.pathname);

        if (stripped === "/" && this.defaultPath !== "/") {
            // `navigate` applies `replaceState` synchronously, so re-reading the
            // location yields the redirected path immediately.
            navigate(this.#join(this.defaultPath), { mode: "replace" });
            stripped = this.#strip(window.location.pathname);
        }

        const next = matchRoute(stripped, this.routes);

        // Publish the mount path (minus any tab tail) so routed `<ak-tabs>` under
        // this outlet can consume it as their base. Refreshed even when the route
        // is unchanged, so re-entering the same page restores a correct base.
        this.#tabBaseProvider.setValue(next ? this.#basePath(next) : "");

        // Skip re-resolving when the route and its path parameters are unchanged
        // (a search-param-only change — a tab, a table filter). Reassigning would
        // hand `until()` a new promise and flash the loading state over a view
        // that is already mounted.
        if (this.#preparation && sameRouteMatch(this.current, next)) return;

        this.current = next;
        void this.#prepare(next);
    };

    //#endregion

    //#region Rendering

    // 加载反馈 / 组件绘制动画：目标DOM挂载但不可见；点阵先撤一帧，再揭示整页内容。
    async #prepare(match: RouteMatch<RouteLike> | null) {
        this.#preparation?.dispose();
        this.#animations.forEach((animation) => animation.cancel());
        const preparation = new PagePreparation();
        this.#preparation = preparation;
        const valid = () => !preparation.controller.signal.aborted && this.isConnected;
        this.phase = "preparing";
        this.dataset.routePhase = "preparing";
        this.setAttribute("aria-busy", "true");
        this.content = null;
        this.#positionLoader();

        try {
            const content = match
                ? await match.route.resolve(match.parameters)
                : html`<ak-router-404 url=${window.location.pathname}></ak-router-404>`;

            if (!valid()) return;
            this.content = content;
        } catch (error) {
            if (!valid()) return;
            this.content = this.#renderError(error);
        }

        await this.updateComplete;
        const root = this.querySelector<HTMLElement>(".ak-route-content");

        if (!root || !valid()) return;
        await waitForPage(root, preparation);

        if (!valid()) return;
        preparation.dispose();
        this.phase = "entering";
        this.dataset.routePhase = "entering";
        // 点阵已移除，内容仍隐藏；下一绘制帧才启动Shift5揭示。
        await this.updateComplete;
        await nextPaint();

        if (this.#preparation !== preparation || !this.isConnected) return;
        this.removeAttribute("aria-busy");

        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
            // 组件绘制动画：点阵完全撤下后，整张路由页面作为一个内容层入场。
            this.#animations = [
                root.animate(
                    [
                        { clipPath: "inset(0 0 100% 0)", opacity: 0 },
                        { clipPath: "inset(0)", opacity: 1 },
                    ],
                    {
                        duration: 1008,
                        delay: 50,
                        easing: "cubic-bezier(.16,1,.3,1)",
                        fill: "both",
                    },
                ),
            ];

            await Promise.all(
                this.#animations.map((animation) => animation.finished.catch(() => {})),
            );
        }

        if (this.#preparation !== preparation || !this.isConnected) return;
        this.#animations.forEach((animation) => animation.cancel());
        this.phase = "ready";
        this.dataset.routePhase = "ready";
        this.dispatchEvent(new CustomEvent("ak-route-entered", { bubbles: true, composed: true }));
    }

    #renderError(error: unknown): SlottedTemplateResult {
        const message = error instanceof Error ? error.message : String(error);

        return html`<ak-empty-state icon="fa-times-circle">
            <span>${msg("This page failed to load.", { id: "router.view.error.heading" })}</span>
            <span slot="body">${message}</span>
        </ak-empty-state>`;
    }

    #spanName(): string {
        return formatSpanName(
            this.prefix,
            this.current?.route.name ?? null,
            window.location.pathname,
        );
    }

    protected override updated(changedProperties: PropertyValues): void {
        if (!changedProperties.has("current")) return;

        if (!this.#sentryClient || !sentryReporting(this.#sentryClient)) return;

        const name = this.#spanName();

        if (this.#pageLoadSpan) {
            this.#pageLoadSpan.updateName(name);
            this.#pageLoadSpan.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "route");
            this.#pageLoadSpan = null;
        } else {
            startBrowserTracingNavigationSpan(this.#sentryClient, {
                op: "navigation",
                name,
                attributes: {
                    [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "route",
                },
            });
        }
    }

    render(): TemplateResult {
        return html`<div
                class="ak-route-content"
                aria-hidden=${this.phase === "ready" ? "false" : "true"}
                ?inert=${this.phase !== "ready"}
                style=${styleMap({
                    visibility: this.phase === "preparing" ? "hidden" : "visible",
                    opacity: this.phase === "ready" ? "1" : "0",
                })}
                data-design-id="route-content"
            >
                ${this.content}
            </div>
            ${
                this.phase === "preparing"
                    ? html`<div
                          class="ak-route-loader"
                          style=${styleMap(this.loaderPosition)}
                          data-testid="route-loader"
                      >
                          <ak-spinner></ak-spinner>
                      </div>`
                    : null
            }`;
    }

    //#endregion
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-router-view": RouterView;
    }
}
