import PFButton from "@patternfly/patternfly/components/Button/button.css";
import PFCard from "@patternfly/patternfly/components/Card/card.css";
import PFForm from "@patternfly/patternfly/components/Form/form.css";
import PFFormControl from "@patternfly/patternfly/components/FormControl/form-control.css";
import PFPage from "@patternfly/patternfly/components/Page/page.css";

import { createPaginatedResponse } from "#common/api/responses";
import { applyDocumentTheme } from "#common/theme";
import "#components/ak-page-navbar";
import "#components/ak-status-label";
import "#elements/sidebar/Sidebar";
import "#elements/sidebar/SidebarItem";
import "#elements/ak-table/ak-simple-table";
import "#elements/Spinner";
import "#elements/EmptyState";
import "#elements/dialogs/ak-modal";

import { DefaultBrand } from "#common/ui/config";
import "#user/LibraryPage/ak-library-impl";
import "#elements/PageScrollbar";
import "#flow/stages/identification/IdentificationStage";

import { AKElement } from "#elements/Base";
import { renderDialog } from "#elements/dialogs";
import { BrandingContext } from "#elements/mixins/branding";
import { AuthentikConfigContext } from "#elements/mixins/config";

import UserStyles from "#user/ak-interface-user.css";

import AdminStyles from "#admin/ak-interface-admin.css";
import { ApplicationListPage } from "#admin/applications/ApplicationListPage";
import { createAdminSidebarEntries, renderSidebarItems } from "#admin/navigation/sidebar";

import type { Config } from "@goauthentik/api";
import { Application, FlowDesignationEnum, UiThemeEnum } from "@goauthentik/api";

import "#flow/FlowExecutor";

import { ContextProvider } from "@lit/context";
import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

export default {
    title: "Design system / First",
    parameters: { layout: "fullscreen" },
};

// Storybook-only fixtures: no backend, real accounts, or request handlers.
const applications = ["Workspace", "Documentation", "Monitoring", "Source control"].map(
    (name, i) =>
        ({
            pk: `design-${i}`,
            name,
            slug: `design-${i}`,
            launchUrl: "#",
            metaDescription: "Your connected workspace",
        }) as Application,
);

// Actual application-list rendering; only the list data source and documentation pane are local fixtures.
@customElement("ak-first-application-list")
export class FirstApplicationList extends ApplicationListPage {
    override async apiEndpoint() {
        return createPaginatedResponse(
            applications.filter((item) =>
                item.name.toLowerCase().includes((this.search ?? "").toLowerCase()),
            ),
        );
    }
    protected override renderSidebarAfter() {
        return html``;
    }
}

@customElement("ak-first-design-preview")
export class FirstDesignPreview extends AKElement {
    private readonly brandProvider = new ContextProvider(this, {
        context: BrandingContext,
        initialValue: DefaultBrand,
    });
    private readonly configProvider = new ContextProvider(this, {
        context: AuthentikConfigContext,
        initialValue: { capabilities: [] } as unknown as Config,
    });

    @property({ type: Boolean, reflect: true, attribute: "sidebar" }) sidebarOpen =
        window.matchMedia("(width > 768px)").matches;
    @property() view = "admin";

    static styles = [
        PFPage,
        PFButton,
        PFCard,
        PFForm,
        PFFormControl,
        AdminStyles,
        css`
            .content {
                padding: 32px;
                display: grid;
                gap: 24px;
                min-width: 0;
            }
            .intro {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
            }
            .intro h2 {
                margin: 0 0 8px;
                font-size: 28px;
                line-height: 36px;
            }
            p {
                margin: 0;
                color: var(--ak-first-text-3);
            }
            .metrics {
                display: grid;
                grid-template-columns: repeat(3, minmax(0, 1fr));
                gap: 16px;
            }
            .metric {
                padding: 24px;
            }
            .metric strong {
                display: block;
                margin: 16px 0 6px;
                font: 500 36px/44px var(--ak-first-mono);
            }
            .metric h3 {
                font: 500 13px/20px var(--ak-first-body);
                margin: 0;
                color: var(--ak-first-text-2);
            }
            .panel {
                padding: 24px;
                min-width: 0;
            }
            .panel h3 {
                margin: 0 0 16px;
            }
            .two-columns {
                display: grid;
                grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
                gap: 24px;
            }
            .table-region {
                overflow-x: auto;
                background: var(--ak-first-bg);
                border-radius: 12px;
            }
            .form-row {
                display: grid;
                gap: 6px;
                margin-block-end: 16px;
            }
            .actions {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 8px;
            }
            .controls {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                align-items: center;
                margin-top: 24px;
            }
            .notice {
                padding: 14px 16px;
                border-radius: 18px;
                background: var(--ak-first-info-bg);
                color: var(--ak-first-text-2);
            }
            .pf-c-page__main {
                display: block;
            }
            @media (width <= 1024px) {
                .two-columns {
                    grid-template-columns: minmax(0, 1fr);
                }
            }
            @media (width <= 640px) {
                .content {
                    padding: 24px 16px;
                }
                .metrics {
                    grid-template-columns: minmax(0, 1fr);
                }
                .panel,
                .metric {
                    padding: 20px;
                }
            }
        `,
    ];

    render() {
        const toggle = () => {
            this.sidebarOpen = !this.sidebarOpen;
        };

        return html`
            <!-- 顶栏 / 侧边栏：与真实管理壳共用组件和样式，数据仅为本地视觉样本。 -->
            <div class="pf-c-page" data-design-id="design-preview-shell">
                <ak-page-navbar
                    .header=${this.view === "user" ? "Applications" : "Overview"}
                    .description=${"Identity and access management"}
                    .brand=${{ ...DefaultBrand, brandingLogo: "/static/dist/assets/icons/icon_left_brand.svg" }}
                >
                    <button
                        slot="toggle"
                        type="button"
                        class="pf-c-button pf-m-plain"
                        data-testid="preview-navigation-toggle"
                        aria-label="Toggle navigation"
                        aria-expanded=${this.sidebarOpen}
                        @click=${toggle}
                    >
                        <i class="fas fa-bars" aria-hidden="true"></i>
                    </button>
                </ak-page-navbar>
                <ak-sidebar
                    .brand=${{ ...DefaultBrand, brandingLogo: "/static/dist/assets/icons/icon_left_brand.svg" }}
                    .collapsed=${!this.sidebarOpen}
                    class="pf-c-page__sidebar ${this.sidebarOpen ? "pf-m-expanded" : "pf-m-collapsed"}"
                    @ak-sidebar-toggle=${toggle}
                    @ak-sidebar-expand=${() => {
                        this.sidebarOpen = window.matchMedia("(width > 768px)").matches;
                    }}
                >
                    ${renderSidebarItems(createAdminSidebarEntries(), () => null)}
                </ak-sidebar>
                <div class="pf-c-page__drawer">
                    <main class="pf-c-page__main">
                        ${this.view === "user" ? html`<ak-library-impl .apps=${applications}></ak-library-impl>` : this.view === "applications" ? html`<ak-first-application-list></ak-first-application-list>` : this.renderAdmin()}
                    </main>
                    <button
                        class="pf-c-page__sidebar-backdrop"
                        type="button"
                        aria-label="Close navigation"
                        @click=${toggle}
                    ></button>
                </div>
            </div>
            <ak-page-scrollbar></ak-page-scrollbar>
        `;
    }

    renderAdmin() {
        return html`<div class="content">
            <!-- 展示信息模块 / 高亮弧边按钮：可扫描的标题、正文与操作层级。 -->
            <div class="intro">
                <div>
                    <h2>Identity, at a glance.</h2>
                    <p>A clear view of your applications, people, and access.</p>
                </div>
                <button
                    class="pf-c-button pf-m-primary ak-first-arc"
                    data-testid="preview-primary"
                    type="button"
                >
                    Create application
                </button>
            </div>
            <!-- 展示卡片 / 数字展示：数字独立等宽，标签使用正文字体。 -->
            <div class="metrics">
                ${[
                    ["Applications", "24", "Connected workspaces"],
                    ["Users", "1,284", "People in your directory"],
                    ["Active sessions", "386", "Across all applications"],
                ].map(
                    ([label, value, sub]) => html`
                        <section class="pf-c-card metric">
                            <h3>${label}</h3>
                            <strong>${value}</strong>
                            <p>${sub}</p>
                        </section>
                    `,
                )}
            </div>
            <div class="two-columns">
                <section class="pf-c-card panel">
                    <h3>Recent activity</h3>
                    <!-- 展示信息模块 / 区分-状态牌：真实表格和标签组件在各自 Shadow DOM 验证。 -->
                    <div class="table-region">
                        <ak-simple-table
                            .columns=${["User", "Application", "Status"]}
                            .content=${[
                                [
                                    "alex@example.com",
                                    "Workspace",
                                    html`<ak-status-label
                                        good
                                        good-label="Allowed"
                                    ></ak-status-label>`,
                                ],
                                [
                                    "taylor@example.com",
                                    "Documentation",
                                    html`<ak-status-label
                                        good
                                        good-label="Allowed"
                                    ></ak-status-label>`,
                                ],
                                [
                                    "long-user-name@example.com",
                                    "Source control",
                                    html`<ak-status-label bad-label="Denied"></ak-status-label>`,
                                ],
                            ]}
                        ></ak-simple-table>
                    </div>
                    <div class="controls">
                        <ak-status-label good good-label="Healthy"></ak-status-label
                        ><ak-status-label type="warning" bad-label="Attention"></ak-status-label
                        ><ak-spinner></ak-spinner>
                    </div>
                </section>
                <section class="pf-c-card panel">
                    <h3>Application details</h3>
                    <!-- 填写框 / 普通按钮 / 删除按钮：验证焦点、禁用与风险外观。 -->
                    <label class="form-row"
                        ><span>Application name</span
                        ><input
                            class="pf-c-form-control"
                            data-testid="preview-name"
                            value="Workspace"
                    /></label>
                    <label class="form-row"
                        ><span>Protocol</span
                        ><select class="pf-c-form-control" data-testid="preview-protocol">
                            <option>OAuth2 / OIDC</option>
                            <option>SAML</option>
                        </select></label
                    >
                    <div class="actions">
                        <button type="button" class="pf-c-button" data-testid="preview-secondary">
                            Cancel</button
                        ><button
                            type="button"
                            class="pf-c-button pf-m-primary"
                            data-testid="preview-save"
                        >
                            Save</button
                        ><button
                            type="button"
                            class="pf-c-button pf-m-danger"
                            data-testid="preview-delete"
                        >
                            Delete</button
                        ><button type="button" class="pf-c-button" disabled>Disabled</button>
                    </div>
                </section>
            </div>
            <!-- 提示信息：视觉样本明确保留在 Storybook，不会成为产品业务数据。 -->
            <p class="notice">Component preview · sample data · no backend connection</p>
        </div>`;
    }
}

@customElement("ak-first-user-preview")
export class FirstUserPreview extends AKElement {
    static styles = [PFPage, PFButton, UserStyles];

    render() {
        return html`<div class="pf-c-page" data-design-id="user-shell-preview">
                <!-- 顶栏 / 品牌标识：与用户门户相同的壳，不在门户添加管理侧栏。 -->
                <header class="pf-c-page__header">
                    <a href="#" aria-label="Home"
                        ><img
                            class="pf-c-brand"
                            src="/static/dist/assets/icons/icon_left_brand.svg"
                            alt="authentik"
                    /></a>
                    <ak-nav-buttons></ak-nav-buttons>
                </header>
                <main class="pf-c-page__main">
                    <ak-library-impl .apps=${applications}></ak-library-impl>
                </main>
            </div>
            <ak-page-scrollbar></ak-page-scrollbar>`;
    }
}

const themeControl = {
    options: [UiThemeEnum.Light, UiThemeEnum.Dark],
    control: { type: "select" },
};

export const Admin = {
    args: { theme: UiThemeEnum.Light },
    argTypes: { theme: themeControl },
    render: ({ theme }: { theme: UiThemeEnum }) => {
        applyDocumentTheme(theme === UiThemeEnum.Dark ? "dark" : "light");

        return html`<ak-first-design-preview></ak-first-design-preview>`;
    },
};

export const User = {
    args: { theme: UiThemeEnum.Light },
    argTypes: { theme: themeControl },
    render: ({ theme }: { theme: UiThemeEnum }) => {
        applyDocumentTheme(theme === UiThemeEnum.Dark ? "dark" : "light");

        return html`<ak-first-user-preview></ak-first-user-preview>`;
    },
};

function authenticationPreview(error = false) {
    applyDocumentTheme("light");

    return html`<ak-flow-executor
        class="pf-c-login"
        .brand=${{ ...DefaultBrand, brandingLogo: "/static/dist/assets/icons/icon_left_brand.svg" }}
        .challenge=${{
            component: "ak-stage-identification",
            userFields: ["username"],
            passwordFields: true,
            primaryAction: "Sign in",
            flowDesignation: FlowDesignationEnum.Authentication,
            responseErrors: error
                ? {
                      uid_field: [
                          {
                              string: "Invalid username or password.",
                              code: "invalid",
                          },
                      ],
                  }
                : {},
            flowInfo: { title: "Welcome back", layout: "stacked", background: "" },
        }}
    ></ak-flow-executor>`;
}

export const Authentication = () => authenticationPreview();
export const AuthenticationError = () => authenticationPreview(true);

// Actual business component, isolated list fixtures; no authenticated backend claim.
export const ApplicationControls = {
    render: () => {
        applyDocumentTheme("light");

        return html`<ak-first-design-preview view="applications"></ak-first-design-preview>`;
    },
};

// 提示信息 / 填写框 / 高亮弧边按钮：复用真实Dialog与空态，样本不提交业务数据。
@customElement("ak-first-feedback-preview")
export class FirstFeedbackPreview extends AKElement {
    static styles = [
        PFButton,
        PFCard,
        PFFormControl,
        css`
            main {
                padding: 24px;
                display: grid;
                gap: 24px;
            }
            .controls {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
        `,
    ];

    render() {
        return html`<main data-design-id="feedback-preview">
            <div class="controls">
                <button class="pf-c-button pf-m-secondary" data-testid="preview-normal">
                    普通按钮
                </button>
                <button class="pf-c-button pf-m-primary" data-testid="preview-emphasis">
                    强调按钮
                </button>
                <button
                    class="pf-c-button ak-first-default-arc"
                    data-testid="preview-dialog"
                    @click=${(event: MouseEvent) => {
                        void renderDialog(
                            html`<ak-modal
                                headline="确认此操作：长标题应完整换行，不隐藏关键内容"
                                cancel-button-label="取消"
                            >
                                <p>确认操作保留原生焦点管理、Escape 和异步业务边界。</p>
                                <button
                                    slot="actions"
                                    class="pf-c-button pf-m-primary ak-first-highlight"
                                    data-testid="preview-confirm"
                                    @click=${(e: MouseEvent) => {
                                        (e.currentTarget as HTMLElement)
                                            .closest("ak-modal")
                                            ?.close();
                                    }}
                                >
                                    确认
                                </button>
                            </ak-modal>`,
                            {
                                parentElement: this,
                                invokerElement: event.currentTarget as HTMLElement,
                            },
                        );
                    }}
                >
                    打开弹窗
                </button>
            </div>
            <input class="pf-c-form-control" aria-label="搜索示例" placeholder="输入名称进行搜索" />
            <ak-empty-state
                ><span>暂无内容</span
                ><span slot="body"
                    >空状态使用原SVG；错误、加载与无数据分别保留。</span
                ></ak-empty-state
            >
        </main>`;
    }
}

export const Feedback = {
    render: () => html`<ak-first-feedback-preview></ak-first-feedback-preview>`,
};
