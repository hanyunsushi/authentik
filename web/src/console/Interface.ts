import "#components/ak-nav-buttons";
import "#components/notifications/APIDrawer";
import "#components/notifications/NotificationDrawer";
import "#elements/router/core/RouterView";
import "#elements/EmptyState";
import PFDrawer from "@patternfly/patternfly/components/Drawer/drawer.css";
import "#elements/commands/ak-command-palette-user-modal";

import { isAPIResultReady } from "#common/api/responses";
import { consoleRuntime, type ConsoleNavigationItem } from "#common/console";

import { AuthenticatedInterface } from "#elements/AuthenticatedInterface";
import { AKElement } from "#elements/Base";
import {
    createCommonCommands,
    CommandPrefix,
    PaletteCommandNamespace,
    type PaletteCommandDefinitionInit,
} from "#elements/commands/shared";
import { renderDialog } from "#elements/dialogs";
import { WithBrandConfig, BrandingContext } from "#elements/mixins/branding";
import { WithCapabilitiesConfig } from "#elements/mixins/capabilities";
import { WithLicenseSummary } from "#elements/mixins/license";
import { WithNotifications, NotificationsContext } from "#elements/mixins/notifications";
import {
    WithSession,
    SessionContext,
    UIConfigContext,
    canAccessAdmin,
} from "#elements/mixins/session";
import { initRouter } from "#elements/router/core/config";
import {
    formatInterfacePrefix,
    toAdminInterface,
    toUserInterface,
} from "#elements/router/core/interfaces";
import { RouterNavigateEvent, navigate } from "#elements/router/core/navigation";
import { PageDetailsUpdate } from "#elements/router/meta";
import { menuIconSvgForPath } from "#elements/sidebar/menu-model";

import { AKDrawerChangeEvent } from "#components/notifications/events";
import { readDrawerParams, renderNotificationDrawerPanel } from "#components/notifications/utils";

import { ROUTES as UserRoutes, DEFAULT_PATH as UserDefault } from "#user/Routes";

import {
    createAdminSidebarEntries,
    createAdminSidebarEnterpriseEntries,
    type SidebarEntry,
} from "#admin/navigation/sidebar";
import { ROUTES as AdminRoutes, DEFAULT_PATH as AdminDefault } from "#admin/Routes";

import { CapabilitiesEnum } from "@goauthentik/api";

import { ContextProvider } from "@lit/context";
import { msg } from "@lit/localize";
import { css, html, render, type PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { keyed } from "lit/directives/keyed.js";

@customElement("ak-console-header")
class ConsoleHeader extends AKElement {
    owner!: ConsoleInterface;
    #session = new ContextProvider(this, { context: SessionContext });
    #ui = new ContextProvider(this, { context: UIConfigContext });
    #notifications = new ContextProvider(this, { context: NotificationsContext });
    #brand = new ContextProvider(this, { context: BrandingContext });

    sync(owner: ConsoleInterface): void {
        this.owner = owner;
        this.#session.setValue(owner.session);
        this.#ui.setValue(owner.uiConfig);
        this.#notifications.setValue(owner.notifications);
        this.#brand.setValue(owner.brand);
        this.requestUpdate();
    }

    static styles = [
        css`
            /* 顶栏 / 普通按钮：原生账户与抽屉控件保留在宿主槽，手机保持文字入口可达。 */
            :host {
                display: block;
                max-width: 100%;
            }
            @media (width <= 768px) {
                :host .command-palette-trigger {
                    display: none;
                }
            }
        `,
    ];

    protected render() {
        const owner = this.owner;

        if (!owner?.currentUser) return html``;

        return html`<ak-nav-buttons>
            ${
                owner.interfaceName === "admin"
                    ? html`<a
                          class="pf-c-button pf-m-primary"
                          data-testid="console-switch-to-user"
                          href=${toUserInterface()}
                          >${msg("User interface", { id: "console.navigation.user-interface.label" })}</a
                      >`
                    : canAccessAdmin(owner.currentUser)
                      ? html`<a
                            class="pf-c-button pf-m-primary"
                            data-testid="console-switch-to-admin"
                            href=${toAdminInterface()}
                            >${msg("Admin interface", { id: "console.navigation.admin-interface.label" })}</a
                        >`
                      : null
            }
            <button
                slot="extra"
                class="pf-c-button pf-m-plain command-palette-trigger"
                type="button"
                data-testid="console-command-palette"
                aria-label=${msg("Open Command Palette", { id: "console.command-palette.label" })}
                @click=${owner.commandPalette.showListener}
            >
                <svg class="ak-c-vector-icon" viewBox="0 0 32 32" aria-hidden="true">
                    <path
                        d="M26 4.01H6a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-20a2 2 0 0 0-2-2m0 2v4H6v-4Zm-20 20v-14h20v14Z"
                    />
                    <path d="m10.76 16.18 2.82 2.83-2.82 2.83 1.41 1.41 4.24-4.24-4.24-4.24z" />
                </svg>
            </button>
        </ak-nav-buttons>`;
    }
}

@customElement("ak-console-interface")
export class ConsoleInterface extends WithNotifications(
    WithLicenseSummary(
        WithBrandConfig(WithSession(WithCapabilitiesConfig(AuthenticatedInterface))),
    ),
) {
    @property({ attribute: false }) interfaceName: "admin" | "user" = "user";
    @property({ attribute: false }) drawer = readDrawerParams();
    static styles = [
        PFDrawer,
        css`
            /* 展示信息模块：正文使用原生页面留白，统一外壳负责顶部、侧栏与页面滚动。 */
            :host {
                display: block;
                min-width: 0;
                min-height: var(--console-page-height, calc(100dvh - 64px));
            }
            ak-router-view {
                display: block;
                min-width: 0;
                min-height: var(--console-page-height, calc(100dvh - 64px));
            }
            .pf-c-drawer__content,
            .pf-c-drawer__body {
                min-width: 0;
            }
        `,
    ];
    #pageDetails = (event: PageDetailsUpdate) => {
        consoleRuntime()?.context.onHeader?.({
            mounted: true,
            title: String(event.header.header || "Authentik"),
            ready: true,
        });
    };
    #drawerChanged = (event: AKDrawerChangeEvent) => {
        this.drawer = event.drawer;
    };
    #commandsFrame = 0;
    #notificationTimer = 0;
    #refreshNotifications = () => {
        if (!document.hidden) void this.refreshNotifications();
    };
    #interceptLink = (event: MouseEvent) => {
        const anchor = event
            .composedPath()
            .find((node): node is HTMLAnchorElement => node instanceof HTMLAnchorElement);

        if (
            !anchor ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey ||
            anchor.target ||
            anchor.hasAttribute("download")
        )
            return;

        const url = new URL(anchor.href);

        if (
            url.origin === location.origin &&
            /^\/authentik\/if\/(admin|user)\//.test(url.pathname)
        ) {
            event.preventDefault();
            navigate(url);
        }
    };

    public connectedCallback(): void {
        super.connectedCallback();
        window.addEventListener(PageDetailsUpdate.eventName, this.#pageDetails);
        window.addEventListener(AKDrawerChangeEvent.eventName, this.#drawerChanged);
        document.addEventListener("click", this.#interceptLink, { capture: true });
        // 认证接入：通知只通过当前OAuth身份读取，避免混用IdP Cookie会话的消息内容。
        this.#notificationTimer = window.setInterval(this.#refreshNotifications, 60000);
        document.addEventListener("visibilitychange", this.#refreshNotifications);
    }

    public disconnectedCallback(): void {
        window.removeEventListener(PageDetailsUpdate.eventName, this.#pageDetails);
        window.removeEventListener(AKDrawerChangeEvent.eventName, this.#drawerChanged);
        document.removeEventListener("click", this.#interceptLink, { capture: true });
        const target = consoleRuntime()?.context.topbarTarget;

        if (target) render(null, target);
        cancelAnimationFrame(this.#commandsFrame);
        clearInterval(this.#notificationTimer);
        document.removeEventListener("visibilitychange", this.#refreshNotifications);
        super.disconnectedCallback();
    }

    public setPath(path: string): void {
        this.interfaceName = path.startsWith("/if/admin/") ? "admin" : "user";
        initRouter({ base: "/authentik/", interfaceName: this.interfaceName });
        window.dispatchEvent(new RouterNavigateEvent());
    }

    protected navigation(): ConsoleNavigationItem[] {
        const context = consoleRuntime()?.context;

        if (!context || !this.currentUser) return [];

        const userItems: ConsoleNavigationItem[] = [
            {
                key: "library",
                label: msg("Applications", { id: "console.navigation.applications.label" }),
                path: "/if/user/library",
                iconSvg: menuIconSvgForPath("/core/applications"),
            },
        ];

        if (this.uiConfig.enabledFeatures.settings)
            userItems.push({
                key: "settings",
                label: msg("Settings", { id: "console.navigation.settings.label" }),
                path: "/if/user/settings",
                iconSvg: menuIconSvgForPath("/core/settings"),
            });

        if (
            this.hasEnterpriseLicense &&
            this.uiConfig.enabledFeatures.requests &&
            this.can(CapabilitiesEnum.CanRequest)
        )
            userItems.push({
                key: "requests",
                label: msg("Discover", { id: "console.navigation.discover.label" }),
                path: "/if/user/requests",
                iconSvg: menuIconSvgForPath("/requests/access-requests"),
            });

        if (
            this.hasEnterpriseLicense &&
            this.uiConfig.enabledFeatures.agents &&
            this.can(CapabilitiesEnum.CanAgentSelfService)
        )
            userItems.push({
                key: "agents",
                label: msg("Agents", { id: "console.navigation.agents.label" }),
                path: "/if/user/agents",
                iconSvg: menuIconSvgForPath("/identity/agents"),
            });

        const items: ConsoleNavigationItem[] = [
            {
                key: "home",
                label: msg("Home", { id: "console.navigation.home.label" }),
                path: "/",
                public: true,
            },
        ];

        // 侧边栏：只发布右上角所选界面的菜单，管理员进入用户界面也不混入管理入口。
        if (this.interfaceName === "user") return [...items, ...userItems];

        if (canAccessAdmin(this.currentUser)) {
            const convert = ([
                path,
                label,
                attrs,
                children,
            ]: SidebarEntry): ConsoleNavigationItem | null => {
                const enterprise = attrs && !Array.isArray(attrs) && attrs.enterprise;

                if (
                    enterprise &&
                    !this.hasEnterpriseLicense &&
                    !this.can(CapabilitiesEnum.IsEnterprise)
                )
                    return null;

                return {
                    key: path ?? label,
                    label,
                    group: !path,
                    expanded: true,
                    ...(path
                        ? {
                              path: `/if/admin${enterprise && !this.hasEnterpriseLicense ? "/enterprise/licenses" : path}`,
                          }
                        : {}),
                    ...(children
                        ? {
                              children: children
                                  .map(convert)
                                  .filter((item): item is ConsoleNavigationItem => !!item),
                          }
                        : {}),
                    ...(path ? { iconSvg: menuIconSvgForPath(path) } : {}),
                };
            };

            const entries = [
                ...createAdminSidebarEntries(),
                ...(this.can(CapabilitiesEnum.IsEnterprise)
                    ? createAdminSidebarEnterpriseEntries()
                    : []),
            ];

            items.push(
                ...entries.map(convert).filter((item): item is ConsoleNavigationItem => !!item),
            );
        }

        return items;
    }

    protected updated(changed: PropertyValues<this>): void {
        super.updated(changed);

        if (!isAPIResultReady(this.session)) return;
        const runtime = consoleRuntime();
        const navigation = this.navigation();
        runtime?.context.onNavigation?.(navigation);
        cancelAnimationFrame(this.#commandsFrame);

        this.#commandsFrame = requestAnimationFrame(() => {
            const commands: PaletteCommandDefinitionInit[] = createCommonCommands();

            const append = (items: ConsoleNavigationItem[], group?: string) => {
                for (const item of items) {
                    if (item.path)
                        commands.push({
                            namespace: PaletteCommandNamespace.Navigation,
                            label: item.label,
                            group,
                            action: () => navigate(`/authentik${item.path}`),
                        });

                    if (item.children) append(item.children, item.label);
                }
            };

            append(navigation);

            if (this.interfaceName === "admin") {
                commands.push({
                    label: msg("Create a new application...", {
                        id: "console.application.create.label",
                    }),
                    action: () =>
                        navigate(
                            toAdminInterface("core/applications", {
                                "create-wizard": "application",
                            }),
                        ),
                });

                commands.push({
                    namespace: PaletteCommandNamespace.Search,
                    label: msg("Username or email address...", { id: "console.user-search.label" }),
                    prefix: CommandPrefix.SearchFor(),
                    action: (_data, event) => {
                        event?.stopPropagation();

                        const palette = this.ownerDocument.createElement(
                            "ak-command-palette-user-modal",
                        );

                        renderDialog(palette, { parentElement: this });
                        palette.show();
                    },
                });
            }

            this.commandPalette.modal.setCommands(
                commands.map((command) => ({
                    namespace: PaletteCommandNamespace.Action,
                    ...command,
                })),
            );
        });

        const target = runtime?.context.topbarTarget;

        if (target) {
            render(html`<ak-console-header></ak-console-header>`, target);
            target.querySelector<ConsoleHeader>("ak-console-header")?.sync(this);
        }
    }

    protected render() {
        if (!isAPIResultReady(this.session)) return html`<ak-spinner></ak-spinner>`;

        if (this.interfaceName === "admin" && !canAccessAdmin(this.currentUser)) {
            consoleRuntime()?.context.onNavigate("/if/user/library");

            return html``;
        }

        return html`<div
                class="pf-c-drawer ${this.drawer.notifications || this.drawer.api ? "pf-m-expanded" : "pf-m-collapsed"}"
                data-design-id="console-authentik-content"
            >
                <div class="pf-c-drawer__main">
                    <div class="pf-c-drawer__content">
                        <div class="pf-c-drawer__body">
                            ${keyed(
                                this.interfaceName,
                                html`<ak-router-view
                                    id="main-content"
                                    .routes=${this.interfaceName === "admin" ? AdminRoutes : UserRoutes}
                                    .prefix=${formatInterfacePrefix("/authentik/", this.interfaceName)}
                                    .defaultPath=${this.interfaceName === "admin" ? AdminDefault : UserDefault}
                                ></ak-router-view>`,
                            )}
                        </div>
                    </div>
                    ${renderNotificationDrawerPanel(this.drawer)}
                </div>
            </div>
            ${this.commandPalette}`;
    }
}
