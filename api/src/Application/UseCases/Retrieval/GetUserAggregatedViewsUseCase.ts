import type { BaseUseCase } from "src/Application/BaseUseCase";
import type Observation from "src/Domain/Entities/Observation/Entity";
import { ObservationRepository } from "src/Infra/Database/Repositories/ObservationRepository";
import { DataStreamDailyRollupRepository } from "src/Infra/Database/Repositories/DataStreamDailyRollupRepository";
import { DataStreamRepository } from "src/Infra/Database/Repositories/DataStreamRepository";

export type AggregationPeriod = "hour" | "day" | "week" | "month";

type Daily = {
    day: string; // YYYYMMDD (UTC)
    count: number;
    sum: number;
    min?: number;
    max?: number;
};

type Input = {
    userId: string;
    streamId: string;
    startDate: Date;
    endDate: Date;
    period: AggregationPeriod;
    rollingWindowDays?: number;
};

type TrendPoint = {
    periodStart: string;
    periodEnd: string;
    avg?: number;
    min?: number;
    max?: number;
    sum?: number;
    count: number;
};

type Output = {
    userId: string;
    streamId: string;
    period: AggregationPeriod;
    timeRange: { start: string; end: string };
    trend: TrendPoint[];
    overallStatistics: {
        totalDataPoints: number;
        overallAvg?: number;
        overallMin?: number;
        overallMax?: number;
        change?: number;
        changePercent?: number;
    };
};

export class GetUserAggregatedViewsUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly dataStreamRepository: DataStreamRepository,
        private readonly rollupRepository: DataStreamDailyRollupRepository,
        private readonly observationRepository: ObservationRepository,
    ) { }

    async execute(input: Input): Promise<Output> {
        const { userId, streamId, startDate, endDate, period, rollingWindowDays } = input;

        if (startDate > endDate) {
            throw new Error("Start date must be before end date");
        }

        // 🔐 Validate stream ownership
        const stream = await this.dataStreamRepository.findById(streamId);
        if (!stream || stream.userId !== userId) {
            throw new Error("Stream not found or not owned by user");
        }

        const trend =
            period === "hour"
                ? await this.buildHourlyTrend(streamId, startDate, endDate)
                : await this.buildRollupTrend(streamId, startDate, endDate, period, rollingWindowDays);

        const overallStatistics = computeOverallStatistics(trend);

        return {
            userId,
            streamId,
            period,
            timeRange: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
            trend,
            overallStatistics,
        };
    }

    private async buildHourlyTrend(streamId: string, start: Date, end: Date): Promise<TrendPoint[]> {
        const observations = await this.observationRepository.findByStreamAndRange(streamId, start, end);

        // bucket by hourStart ISO
        const buckets = new Map<string, Observation[]>();
        for (const obs of observations) {
            const hourStart = new Date(obs.observedAt);
            hourStart.setUTCMinutes(0, 0, 0);
            const key = hourStart.toISOString();
            (buckets.get(key) ?? buckets.set(key, []).get(key)!).push(obs);
        }

        // ensure chronological order
        const keys = Array.from(buckets.keys()).sort((a, b) => a.localeCompare(b));

        return keys.map((startISO) => {
            const obs = buckets.get(startISO)!;
            const values = obs.map((o) => o.getNumericValue()).filter(isNumber);

            const sum = values.reduce((a, b) => a + b, 0);
            const count = values.length;

            return {
                periodStart: startISO,
                periodEnd: new Date(new Date(startISO).getTime() + 3600_000).toISOString(),
                count,
                sum,
                avg: count ? sum / count : undefined,
                min: count ? Math.min(...values) : undefined,
                max: count ? Math.max(...values) : undefined,
            };
        });
    }

    private async buildRollupTrend(
        streamId: string,
        start: Date,
        end: Date,
        period: Exclude<AggregationPeriod, "hour">,
        rollingWindowDays?: number,
    ): Promise<TrendPoint[]> {
        const dayKeys = buildDayKeysUTC(start, end);

        const rollups = await this.rollupRepository.findManyByStreamIdAndDays(streamId, dayKeys);

        // normalize, index by day
        const dailyByDay = new Map<string, Daily>();
        for (const r of rollups) {
            dailyByDay.set(r.day, {
                day: r.day,
                count: r.stats.count,
                sum: r.stats.sum ?? 0,
                min: r.stats.min,
                max: r.stats.max,
            });
        }

        // Fill missing days so rolling windows are true calendar windows
        const daily = fillMissingDays(dayKeys, dailyByDay);

        if (rollingWindowDays && rollingWindowDays > 0) {
            return buildRollingWindow(daily, rollingWindowDays);
        }

        if (period === "day") {
            return daily.map((d) => ({
                periodStart: dayStartISO(d.day),
                periodEnd: dayEndISO(d.day),
                count: d.count,
                sum: d.sum,
                avg: d.count ? d.sum / d.count : undefined,
                min: d.min,
                max: d.max,
            }));
        }

        // week/month grouping
        return groupByCalendarPeriod(daily, period);
    }
}

/* --------------------------------- helpers -------------------------------- */

function isNumber(v: unknown): v is number {
    return typeof v === "number" && !Number.isNaN(v);
}

function buildDayKeysUTC(start: Date, end: Date): string[] {
    const out: string[] = [];
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    const endUTC = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));

    while (cur <= endUTC) {
        out.push(toYYYYMMDD(cur));
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return out;
}

function toYYYYMMDD(d: Date): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function parseYYYYMMDDToUTCDate(day: string): Date {
    const normalized = day.includes("-") ? day.replaceAll("-", "") : day;

    if (!/^\d{8}$/.test(normalized)) {
        throw new Error(`Invalid day format: "${day}". Expected YYYYMMDD or YYYY-MM-DD`);
    }

    const y = Number(normalized.slice(0, 4));
    const m = Number(normalized.slice(4, 6));
    const d = Number(normalized.slice(6, 8));

    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function dayStartISO(day: string) {
    return parseYYYYMMDDToUTCDate(day).toISOString();
}

function dayEndISO(day: string) {
    const dt = parseYYYYMMDDToUTCDate(day);
    dt.setUTCHours(23, 59, 59, 999);
    return dt.toISOString();
}

function fillMissingDays(dayKeys: string[], dailyByDay: Map<string, Daily>): Daily[] {
    return dayKeys.map((day) => dailyByDay.get(day) ?? { day, count: 0, sum: 0 });
}

function buildRollingWindow(daily: Daily[], windowDays: number): TrendPoint[] {
    if (windowDays <= 0) throw new Error("rollingWindowDays must be > 0");

    const out: TrendPoint[] = [];
    let windowCount = 0;
    let windowSum = 0;

    for (let i = 0; i < daily.length; i++) {
        const cur = daily[i]!;
        windowCount += cur.count;
        windowSum += cur.sum;

        const removeIndex = i - windowDays;
        if (removeIndex >= 0) {
            const rem = daily[removeIndex]!;
            windowCount -= rem.count;
            windowSum -= rem.sum;
        }

        if (i >= windowDays - 1) {
            const startDay = daily[i - (windowDays - 1)]!.day;
            const endDay = cur.day;

            let wMin: number | undefined = undefined;
            let wMax: number | undefined = undefined;

            for (let j = i - (windowDays - 1); j <= i; j++) {
                const d = daily[j]!;
                if (typeof d.min === "number") wMin = wMin === undefined ? d.min : Math.min(wMin, d.min);
                if (typeof d.max === "number") wMax = wMax === undefined ? d.max : Math.max(wMax, d.max);
            }

            out.push({
                periodStart: dayStartISO(startDay),
                periodEnd: dayEndISO(endDay),
                count: windowCount,
                sum: windowSum,
                avg: windowCount ? windowSum / windowCount : undefined,
                min: wMin,
                max: wMax,
            });
        }
    }

    return out;
}

function groupByCalendarPeriod(daily: Daily[], period: "week" | "month"): TrendPoint[] {
    const buckets = new Map<
        string,
        { start: Date; end: Date; count: number; sum: number; min?: number; max?: number }
    >();

    for (const d of daily) {
        const dayDate = parseYYYYMMDDToUTCDate(d.day);

        const { bucketKey, bucketStart, bucketEnd } =
            period === "week" ? getISOWeekBucket(dayDate) : getMonthBucket(dayDate);

        const existing = buckets.get(bucketKey);
        if (!existing) {
            buckets.set(bucketKey, {
                start: bucketStart,
                end: bucketEnd,
                count: d.count,
                sum: d.sum,
                min: typeof d.min === "number" ? d.min : undefined,
                max: typeof d.max === "number" ? d.max : undefined,
            });
            continue;
        }

        existing.count += d.count;
        existing.sum += d.sum;
        if (typeof d.min === "number") existing.min = existing.min === undefined ? d.min : Math.min(existing.min, d.min);
        if (typeof d.max === "number") existing.max = existing.max === undefined ? d.max : Math.max(existing.max, d.max);
    }

    return Array.from(buckets.values())
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map((b) => ({
            periodStart: b.start.toISOString(),
            periodEnd: b.end.toISOString(),
            count: b.count,
            sum: b.sum,
            avg: b.count ? b.sum / b.count : undefined,
            min: b.min,
            max: b.max,
        }));
}

// ISO week bucket (Monday-start, UTC)
function getISOWeekBucket(dateUTC: Date): { bucketKey: string; bucketStart: Date; bucketEnd: Date } {
    const d = new Date(dateUTC.getTime());
    const day = d.getUTCDay();
    const isoDay = day === 0 ? 7 : day;

    const monday = new Date(d.getTime());
    monday.setUTCDate(monday.getUTCDate() - (isoDay - 1));
    monday.setUTCHours(0, 0, 0, 0);

    const sundayEnd = new Date(monday.getTime());
    sundayEnd.setUTCDate(sundayEnd.getUTCDate() + 6);
    sundayEnd.setUTCHours(23, 59, 59, 999);

    const { isoWeekYear, isoWeekNumber } = getISOWeekYearAndNumber(d);
    const bucketKey = `${isoWeekYear}-W${String(isoWeekNumber).padStart(2, "0")}`;

    return { bucketKey, bucketStart: monday, bucketEnd: sundayEnd };
}

function getMonthBucket(dateUTC: Date): { bucketKey: string; bucketStart: Date; bucketEnd: Date } {
    const y = dateUTC.getUTCFullYear();
    const m = dateUTC.getUTCMonth();

    const start = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999));
    const bucketKey = `${y}-${String(m + 1).padStart(2, "0")}`;

    return { bucketKey, bucketStart: start, bucketEnd: end };
}

function getISOWeekYearAndNumber(dateUTC: Date): { isoWeekYear: number; isoWeekNumber: number } {
    const d = new Date(dateUTC.getTime());
    d.setUTCHours(0, 0, 0, 0);

    const day = d.getUTCDay();
    const isoDay = day === 0 ? 7 : day;

    // Thursday of current week
    d.setUTCDate(d.getUTCDate() + (4 - isoDay));
    const isoWeekYear = d.getUTCFullYear();

    const firstThursday = new Date(Date.UTC(isoWeekYear, 0, 4));
    const firstDay = firstThursday.getUTCDay();
    const firstIsoDay = firstDay === 0 ? 7 : firstDay;

    firstThursday.setUTCDate(firstThursday.getUTCDate() + (4 - firstIsoDay));
    const diffDays = Math.round((d.getTime() - firstThursday.getTime()) / 86400000);
    const isoWeekNumber = 1 + Math.floor(diffDays / 7);

    return { isoWeekYear, isoWeekNumber };
}

function computeOverallStatistics(trend: TrendPoint[]): Output["overallStatistics"] {
    const totalCount = trend.reduce((s, t) => s + t.count, 0);
    const totalSum = trend.reduce((s, t) => s + (t.sum ?? 0), 0);

    const mins = trend.map((t) => t.min).filter(isNumber);
    const maxs = trend.map((t) => t.max).filter(isNumber);

    const stats: Output["overallStatistics"] = {
        totalDataPoints: totalCount,
    };

    if (totalCount > 0) {
        stats.overallAvg = totalSum / totalCount;
        stats.overallMin = mins.length ? Math.min(...mins) : undefined;
        stats.overallMax = maxs.length ? Math.max(...maxs) : undefined;

        if (trend.length >= 2) {
            const first = trend[0]?.avg;
            const last = trend[trend.length - 1]?.avg;
            if (isNumber(first) && isNumber(last)) {
                stats.change = last - first;
                stats.changePercent = first !== 0 ? ((last - first) / first) * 100 : undefined;
            }
        }
    }

    return stats;
}