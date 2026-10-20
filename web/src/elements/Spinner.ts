import { PFSize } from "#common/enums";

import { AKElement } from "#elements/Base";

import { msg } from "@lit/localize";
import { css, html, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ak-spinner")
export class Spinner extends AKElement {
    @property()
    size: PFSize = PFSize.Medium;

    // 加载反馈：固定 20px 点阵，按钮内为 16px，真实请求生命周期不变。
    static styles = [
        css`
            :host(ak-spinner) {
                display: inline-flex;
                color: var(--ak-spinner-color, var(--ak-first-accent));
            }
            .dots {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 14%;
                inline-size: 20px;
                block-size: 20px;
            }
            .pf-m-sm {
                inline-size: 16px;
                block-size: 16px;
            }
            i {
                border-radius: 50%;
                background: currentColor;
                animation: breathe 1s ease-in-out infinite;
                animation-delay: calc(var(--phase) * -250ms);
            }
            @keyframes breathe {
                0%,
                100% {
                    opacity: 0.2;
                    scale: 0.7;
                }
                50% {
                    opacity: 1;
                    scale: 1;
                }
            }
            @keyframes pulse {
                0%,
                100% {
                    opacity: 0.3;
                }
                50% {
                    opacity: 1;
                }
            }
            @media (prefers-reduced-motion: reduce) {
                i {
                    animation: pulse 1.4s ease-in-out infinite !important;
                    scale: 1;
                }
            }
        `,
    ];

    render(): TemplateResult {
        return html`<span
            class="dots ${this.size.toString()}"
            role="status"
            aria-label=${msg("Loading...")}
            data-design-id="dot-matrix-loader"
        >
            ${[0, 1, 2, 1, 2, 3, 2, 3, 4].map((phase) => html`<i aria-hidden="true" style="--phase:${phase}"></i>`)}
            <slot></slot>
        </span>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-spinner": Spinner;
    }
}
