import { createStyleSheetUnsafe } from "#common/stylesheets";

import { PfTooltip } from "@patternfly/elements/pf-tooltip/pf-tooltip.js";

import { css } from "lit";
import { customElement } from "lit/decorators.js";

/** Keep PatternFly positioning and trigger behavior; adapt only the visual surface. */
@customElement("ak-tooltip")
export class AKTooltip extends PfTooltip {
    // 悬浮下拉菜单 / 提示信息：18px 深色面、无装饰箭头；关闭时不扩展页面宽度。
    static readonly styles = [
        ...PfTooltip.styles,
        createStyleSheetUnsafe(css`
            #container:not(.open) {
                overflow: clip;
            }
            #tooltip {
                border-radius: 18px;
                background: var(--ak-first-text);
                color: var(--ak-first-bg);
                font: 400 13px/20px var(--ak-first-body);
                box-shadow: var(--ak-first-flyout);
                max-width: min(300px, calc(100vw - 16px));
            }
            #tooltip::after {
                display: none;
            }
            @media (prefers-reduced-motion: reduce) {
                #tooltip {
                    transition: none;
                }
            }
        `),
    ];
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-tooltip": AKTooltip;
    }
}
