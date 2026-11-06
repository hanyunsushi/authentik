import type { UIConfig } from "#common/ui/config";

import { CapabilitiesEnum, LicenseSummaryStatusEnum, type LicenseSummary } from "@goauthentik/api";

import { msg } from "@lit/localize";

// 侧边栏 / 路由切换组件：独立站与Console共用原用户导航；账户设置继续归顶栏账户菜单。
export function userNavigation(
    uiConfig: UIConfig,
    license: LicenseSummary | null,
    can: (capability: CapabilitiesEnum) => boolean,
) {
    const items = [{ key: "library", label: msg("Applications"), path: "library" }];

    if (license?.status === LicenseSummaryStatusEnum.Unlicensed) return items;

    if (uiConfig.enabledFeatures.requests && can(CapabilitiesEnum.CanRequest)) {
        items.push({ key: "requests", label: msg("Discover"), path: "requests" });
    }

    if (uiConfig.enabledFeatures.agents && can(CapabilitiesEnum.CanAgentSelfService)) {
        items.push({ key: "agents", label: msg("Agents"), path: "agents" });
    }

    return items;
}
