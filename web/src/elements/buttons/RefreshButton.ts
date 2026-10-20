import { SpinnerButton } from "#elements/buttons/SpinnerButton/ak-spinner-button";

import { TaskStatus } from "@lit/task";
import { css, html } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("ak-refresh-button")
export class RefreshButton extends SpinnerButton {
    static styles = [
        ...super.styles,
        css`
            /* 普通按钮 / 悬浮效果：标准刷新只旋转16px SVG，请求中保留相同32/44px几何。 */
            .refresh.pf-c-button {
                width: var(--ak-first-button-height);
                height: var(--ak-first-button-height);
                padding: 0;
                border-radius: 18px;
                border: 1px solid var(--ak-first-border-strong);
                box-shadow: none;
                background: var(--ak-first-card);
            }
            .refresh.pf-c-button:is(:hover, :focus-visible) {
                box-shadow: none;
            }
            svg {
                width: 16px;
                height: 16px;
                transform-origin: center;
                transform-box: view-box;
                transition: transform 0.4s linear;
            }
            button:is(:hover, :focus-visible):not(:disabled) svg {
                transform: rotate(180deg);
            }
            svg.loading {
                animation: refresh-turn 0.8s linear infinite;
            }
            @keyframes refresh-turn {
                to {
                    transform: rotate(360deg);
                }
            }
            @media (prefers-reduced-motion: reduce) {
                svg {
                    animation: none !important;
                    transition: none !important;
                    transform: none !important;
                }
            }
        `,
    ];

    protected override render() {
        const pending = this.actionTask.status === TaskStatus.PENDING;

        return html`<button
            class="pf-c-button refresh"
            type="button"
            part="spinner-button"
            data-testid="table-refresh"
            aria-label=${this.label ?? "Refresh"}
            title=${this.label ?? "Refresh"}
            aria-busy=${pending}
            ?disabled=${this.disabled || pending}
            @click=${this.onClick}
        >
            <!-- 普通按钮：Lucide refresh-cw，ISC许可见侧栏ATTRIBUTION文件。 -->
            <svg
                class=${pending ? "loading" : ""}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
            </svg>
        </button>`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-refresh-button": RefreshButton;
    }
}
