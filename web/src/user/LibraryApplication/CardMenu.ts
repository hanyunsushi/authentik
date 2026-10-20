import "#elements/AppIcon";
import "#user/LibraryApplication/RACLaunchDeviceModal";
import "#elements/buttons/Dropdown";
import "#elements/Divider";
import { truncateWords } from "#common/strings";

import { AnchorPositionSupported } from "#elements/dialogs/positioning";
import { LitFC } from "#elements/types";

import { Application } from "@goauthentik/api";

import { spread } from "@open-wc/lit-helpers";
import type { HTMLAttributes } from "react";

import { msg, str } from "@lit/localize";
import { html } from "lit";

export interface CardMenuProps extends HTMLAttributes<HTMLDivElement> {
    cardID: string;
    descriptionID: string;
    application: Application;
    editURL?: string | URL | null;
}

export const CardMenu: LitFC<CardMenuProps> = ({
    application,
    cardID,
    descriptionID,
    editURL,
    ...props
}) => {
    const { metaDescription, metaPublisher } = application;
    const truncatedDescription = truncateWords(metaDescription, 50);

    const menuID = `${cardID}-actions-menu`;
    const menuAnchor = `--${cardID}-actions-menu-anchor`;

    if (!metaPublisher && !truncatedDescription && !editURL) {
        return null;
    }

    const applicationName = application.name || msg("application");

    // 普通按钮 / 悬浮下拉菜单：方形图标入口，保留原生 Popover 与编辑链接。
    return html`<div class="pf-c-dropdown" part="card-header-actions" ${spread(props)}>
        <button
            part="card-header-actions-button"
            class="pf-c-button pf-m-plain"
            data-testid="library-app-actions"
            type="button"
            style="anchor-name: ${menuAnchor};"
            popovertarget=${menuID}
            popovertargetaction="toggle"
            aria-label=${msg(str`Actions for "${applicationName}"`)}
        >
            <svg part="card-header-actions-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="5" r="1.5" fill="currentColor"></circle>
                <circle cx="12" cy="12" r="1.5" fill="currentColor"></circle>
                <circle cx="12" cy="19" r="1.5" fill="currentColor"></circle>
            </svg>
        </button>
        <menu
            class="pf-c-dropdown__menu"
            part="card-header-actions-menu"
            data-testid="library-app-actions-menu"
            style="position-anchor: ${menuAnchor};"
            id=${menuID}
            ?popover=${AnchorPositionSupported}
        >
            ${
                metaPublisher || truncatedDescription
                    ? html`<li role="presentation">
                              <div
                                  part="card-header-action"
                                  role="contentinfo"
                                  class="pf-c-dropdown__menu-item"
                              >
                                  ${
                                      metaPublisher
                                          ? html`<div part="card-header-action-publisher">
                                                <small>${metaPublisher}</small>
                                            </div>`
                                          : null
                                  }
                                  ${
                                      truncatedDescription
                                          ? html`<p
                                                class="pf-c-content"
                                                part="card-header-action-description"
                                                id=${descriptionID}
                                            >
                                                ${truncatedDescription}
                                            </p>`
                                          : null
                                  }
                              </div>
                          </li>
                          <ak-divider></ak-divider>`
                    : null
            }
            ${
                editURL
                    ? html`<li role="presentation">
                          <a
                              part="card-header-action"
                              data-testid="library-app-edit"
                              role="menuitem"
                              href=${editURL.toString()}
                              class="pf-c-dropdown__menu-item"
                          >
                              <i class="fas fa-edit" role="img"></i>
                              &nbsp;${msg(str`Edit application...`)}</a
                          >
                      </li>`
                    : null
            }
        </menu>
    </div>`;
};
