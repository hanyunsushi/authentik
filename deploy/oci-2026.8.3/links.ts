import { globalAK } from "#common/global";
import { readInterfaceRouteParam } from "#elements/router/utils";
export function toCurrentInterface(path = ""): string { return `${globalAK().api.relBase}if/${readInterfaceRouteParam()}/#${path}`; }
export function toAdminInterface(path = ""): string { return `${globalAK().api.relBase}if/admin/#${path}`; }
