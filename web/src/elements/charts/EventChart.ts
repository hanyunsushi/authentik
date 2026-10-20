import { CHART_CATEGORICAL } from "#common/first-design";
import { actionToLabel } from "#common/labels";

import { AKChart } from "#elements/charts/Chart";

import { EventActions, EventVolume } from "@goauthentik/api";

import { ChartData, ChartDataset } from "chart.js";

import { msg } from "@lit/localize";

export function actionToColor(action: EventActions): string {
    // 展示信息模块：按事件类型稳定映射，不随过滤/排序重分配，不循环复用颜色。
    const index = Object.values(EventActions).indexOf(action);

    return CHART_CATEGORICAL[index] ?? "#8e8e93";
}

export abstract class EventChart extends AKChart<EventVolume[]> {
    public override ariaLabel = msg("Event volume chart");

    eventVolume(
        data: EventVolume[],
        options?: {
            optsMap?: Map<EventActions, Partial<ChartDataset>>;
            padToDays?: number;
        },
    ): ChartData {
        const datasets: ChartData = {
            datasets: [],
        };

        if (!options) {
            options = {};
        }

        if (!options.optsMap) {
            options.optsMap = new Map<EventActions, Partial<ChartDataset>>();
        }

        const actions = new Set(data.map((v) => v.action));

        actions.forEach((action) => {
            const actionData: { x: number; y: number }[] = [];

            data.filter((v) => v.action === action).forEach((v) => {
                actionData.push({
                    x: v.time.getTime(),
                    y: v.count,
                });
            });

            // Check if we need to pad the data to reach a certain time window
            const earliestDate = data
                .filter((v) => v.action === action)
                .map((v) => v.time)
                .sort((a, b) => b.getTime() - a.getTime())
                .reverse();

            if (earliestDate.length > 0 && options.padToDays) {
                const earliestPadded = new Date(
                    new Date().getTime() - options.padToDays * (1000 * 3600 * 24),
                );

                const daysDelta = Math.round(
                    (earliestDate[0].getTime() - earliestPadded.getTime()) / (1000 * 3600 * 24),
                );

                if (daysDelta > 0) {
                    actionData.push({
                        x: earliestPadded.getTime(),
                        y: 0,
                    });
                }
            }

            datasets.datasets.push({
                data: actionData,
                label: actionToLabel(action),
                backgroundColor: actionToColor(action),
                ...options.optsMap?.get(action),
            });
        });

        return datasets;
    }
}
