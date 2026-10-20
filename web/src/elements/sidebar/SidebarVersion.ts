import PFAvatar from "@patternfly/patternfly/components/Avatar/avatar.css";
import PFButton from "@patternfly/patternfly/components/Button/button.css";
import PFNav from "@patternfly/patternfly/components/Nav/nav.css";

import { globalAK } from "#common/global";
import { DefaultBrand } from "#common/ui/config";

import { AKElement } from "#elements/Base";
import { WithLicenseSummary } from "#elements/mixins/license";
import { WithVersion } from "#elements/mixins/version";

import { AboutModal } from "#admin/ak-about-modal";

import { LicenseSummaryStatusEnum } from "@goauthentik/api";

import { msg, str } from "@lit/localize";
import { css, CSSResult, html, nothing } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ak-sidebar-version")
export class SidebarVersion extends WithLicenseSummary(WithVersion(AKElement)) {
    @property({ type: Boolean })
    compact = false;
    static styles: CSSResult[] = [
        PFNav,
        PFAvatar,
        PFButton,
        css`
            .version-link {
                display: block;
                max-width: 100%;
                padding: 0;
                border: 0;
                background: transparent;
                color: var(--ak-first-text-3);
                font: 400 10px/12px var(--ak-first-body);
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                cursor: pointer;
            }
            .version-link:hover {
                color: var(--ak-first-text);
                text-decoration: underline;
            }

            :host {
                display: block;
            }
            footer {
                display: flex;
                width: 100%;
                flex-direction: column;
                justify-content: space-between;
                padding: 1rem !important;
            }
            p {
                text-align: center;
                width: 100%;
                font-size: var(--pf-global--FontSize--xs);
            }
        `,
    ];

    render() {
        if (!this.version || !this.licenseSummary) {
            return nothing;
        }

        // 品牌标识：实际server版本位于品牌区右下，独立入口保留About功能。
        if (this.compact) {
            return html`<button
                class="version-link"
                type="button"
                part="trigger"
                data-testid="sidebar-about"
                title=${this.version.versionCurrent || ""}
                @click=${AboutModal.open}
                aria-label=${msg("Open about dialog")}
            >
                ${this.version.versionCurrent || "—"}
            </button>`;
        }

        let product = globalAK().brand.brandingTitle || DefaultBrand.brandingTitle;

        if (this.licenseSummary.status !== LicenseSummaryStatusEnum.Unlicensed) {
            product += ` ${msg("Enterprise")}`;
        }

        return html`
            <footer aria-label=${msg("authentik information")}>
                <button
                    part="trigger"
                    aria-label=${msg("Open about dialog")}
                    class="pf-c-button pf-m-plain"
                    @click=${AboutModal.open}
                >
                    <p
                        role="heading"
                        aria-level="1"
                        aria-description=${msg("Product name")}
                        id="sidebar-version-product"
                        class="pf-c-title"
                        part="button-content product-name"
                    >
                        ${product}
                    </p>
                    <p
                        role="heading"
                        aria-level="1"
                        aria-description=${msg("Product version")}
                        id="sidebar-version-product"
                        class="pf-c-title"
                        part="button-content product-version"
                    >
                        ${msg(str`Version ${this.version?.versionCurrent || ""}`)}
                    </p>
                </button>
            </footer>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-sidebar-version": SidebarVersion;
    }
}
