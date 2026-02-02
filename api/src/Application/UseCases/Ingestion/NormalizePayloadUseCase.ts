import { BaseUseCase } from "src/Application/BaseUseCase";
import Manufacturer from "src/Domain/Entities/Manufacturer/Entity";
import { IMetric } from "src/Domain/Entities/Metric/Contract";
import Metric from "src/Domain/Entities/Metric/Entity";
import { IObservation } from "src/Domain/Entities/Observation/Contract";

type ManufacturerPayload = Record<string, unknown>;

export type NormalizedObservation = {
    metricCode: IMetric.MetricCode;
    observedAt: Date;
    source: IObservation.ObservationSource;
    value: IObservation.ObservationValue;
    unit: IMetric.MetricUnit;
    rawPayload: ManufacturerPayload;
}

export type NormalizePayloadsResult = {
    observations: NormalizedObservation[];
    errors: string[];
}

type AppleHealthPayload = {
    type?: string;
    startDate?: string;
    endDate?: string;
    value?: number;
    unit?: string;
}

type DexcomPayload = {
    recordId: string;
    systemTime: string;
    displayTime: string;
    transmitterId: string;
    transmitterTicks: number;
    value: number;
    status: string;
    trend: string;
    trendRate: number;
    unit: string;
    rateUnit: string;
    displayDevice: string;
    transmitterGeneration: string;
    displayApp: string;
}

type Input = {
    payload: ManufacturerPayload;
    payloadFormat: string;
    manufacturer: Manufacturer;
    metric: Metric;
}

type Output = NormalizePayloadsResult;

// Maximum allowed future time tolerance (5 minutes) to account for clock skew
const MAX_FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

export class NormalizePayloadUseCase implements BaseUseCase<Input, Output> {
    private isValidObservationDate(date: Date): boolean {
        if (isNaN(date.getTime())) {
            return false;
        }

        const now = Date.now();
        // Reject dates too far in the future (beyond tolerance for clock skew)
        if (date.getTime() > now + MAX_FUTURE_TOLERANCE_MS) {
            return false;
        }

        return true;
    }

    private normalizeValueStructure(metricCode: IMetric.MetricCode, value: number) {
        switch (metricCode) {
            case "steps":
                return { count: value };
            case "sleep_duration":
                return { duration: value };
            default:
                return { numeric: value };
        }
    }

    private normalizeValueForDataType(dataType: IMetric.MetricDataType, value: IObservation.ObservationValue): IObservation.ObservationValue {
        switch (dataType) {
            case "numeric": {
                if (value.numeric == null || Number.isNaN(value.numeric)) {
                    throw new Error("Expected numeric value");
                }
                return { numeric: value.numeric };
            }
            case "count": {
                // allow numeric -> count coercion if you want
                const v = (value.count ?? value.numeric);
                if (v == null || Number.isNaN(v)) throw new Error("Expected count value");
                return { count: Math.trunc(v) };
            }
            case "duration": {
                const v = (value.duration ?? value.numeric);
                if (v == null || Number.isNaN(v)) throw new Error("Expected duration value");
                return { duration: v };
            }
            case "composite": {
                if (!value.composite || typeof value.composite !== "object") {
                    throw new Error("Expected composite value");
                }
                return { composite: value.composite };
            }
            default:
                throw new Error(`Unhandled dataType: ${dataType}`);
        }
    }

    private normalizeToCanonicalUnit(
        metric: Metric,
        value: IObservation.ObservationValue,
        fromUnit: string
    ): IObservation.ObservationValue {
        if (fromUnit === metric.canonicalUnit.code) {
            return value;
        }

        if (metric.dataType === "composite") {
            throw new Error("Cannot normalize composite metric to canonical unit");
        }

        // glucose: mg/dL <-> mmol/L (factor 18.0182-ish; 18 is usually acceptable)
        if (metric.metricCode === "glucose") {
            const n = value.numeric ?? value.count;
            if (n == null) throw new Error("Glucose conversion requires numeric value");

            if (fromUnit === "mg/dL" && metric.canonicalUnit.code === "mmol/L") {
                const mmol = n / 18.0;
                return { numeric: mmol };
            }
            if (fromUnit === "mmol/L" && metric.canonicalUnit.code === "mg/dL") {
                const mgdl = n * 18.0;
                return { numeric: mgdl };
            }
        }

        if (metric.dataType === "duration") {
            const seconds = value.duration ?? value.numeric;
            if (seconds == null) throw new Error("Unable to convert duration, data is not defined");

            const toSecondsFactor = (unitCode: string) => {
                if (unitCode === "s") return 1;
                if (unitCode === "min") return 60;
                if (unitCode === "h") return 3600;
                return null;
            };

            const fromF = toSecondsFactor(fromUnit);
            const toF = toSecondsFactor(metric.canonicalUnit.code);

            if (fromF && toF) {
                const inSeconds = seconds * fromF;
                const converted = inSeconds / toF;
                return { duration: converted };
            }
        }

        // heart_rate: count/min <-> bpm (equivalent)
        if (
            (fromUnit === "count/min" && metric.canonicalUnit.code === "bpm") ||
            (fromUnit === "bpm" && metric.canonicalUnit.code === "count/min")
        ) {
            const n = value.numeric ?? value.count;
            if (n == null) throw new Error("Rate conversion requires numeric value");
            return { numeric: n };
        }

        throw new Error("Unable to find proper conversion");
    }

    private normalizeValue(metric: Metric, value: number, fromUnit: string): IObservation.ObservationValue {
        // first, we normalize to our internal observation value structure
        const normalizedValueStructured = this.normalizeValueStructure(metric.metricCode, value);
        // then, we normalize it based on the data type just to ensure
        const normalizedDataType = this.normalizeValueForDataType(metric.dataType, normalizedValueStructured);
        // we then normalize the actual value, doing some math if needed
        return this.normalizeToCanonicalUnit(metric, normalizedDataType, fromUnit);
    }

    private normalizeAppleHealth(payload: ManufacturerPayload, payloadFormat: string, metric: Metric): Output {
        const results: Output = {
            errors: [],
            observations: []
        };

        if (payloadFormat === 'healthkit_v1') {
            const samples = (payload?.samples || [payload]) as AppleHealthPayload[];

            for (const sample of samples) {
                if (
                    sample?.value === undefined ||
                    !sample?.unit
                ) continue;

                const observedAt = new Date(sample.startDate ?? Date.now());

                if (!this.isValidObservationDate(observedAt)) {
                    results.errors.push(`Invalid observation date: ${sample.startDate}`);
                    continue;
                }

                try {
                    const obs: NormalizedObservation = {
                        metricCode: metric.metricCode,
                        observedAt,
                        source: "device",
                        value: this.normalizeValue(metric, sample.value, sample.unit),
                        unit: metric.canonicalUnit,
                        rawPayload: sample, // Store individual sample, not entire payload
                    }

                    results.observations.push(obs);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown normalization error';
                    results.errors.push(`Failed to normalize Apple Health sample: ${errorMessage}`);
                }
            }
        }

        return results;
    }

    private normalizeDexcom(payload: ManufacturerPayload, payloadFormat: string, metric: Metric): Output {
        const results: Output = {
            errors: [],
            observations: []
        };

        // Support multiple Dexcom EGV format variations
        const isEgvFormat = payloadFormat === 'egv' || payloadFormat === 'dexcom-egv-samples' || payloadFormat === 'egv_samples';

        if (isEgvFormat) {
            const samples = (payload?.egvs || payload?.records || [payload]) as DexcomPayload[];

            for (const sample of samples) {
                if (
                    sample?.value === undefined ||
                    !sample?.unit
                ) continue;

                const observedAt = new Date(sample.systemTime ?? sample.displayTime ?? Date.now());

                if (!this.isValidObservationDate(observedAt)) {
                    results.errors.push(`Invalid observation date: ${sample.systemTime ?? sample.displayTime}`);
                    continue;
                }

                try {
                    const obs: NormalizedObservation = {
                        metricCode: metric.metricCode,
                        observedAt,
                        source: "device",
                        value: this.normalizeValue(metric, sample.value, sample.unit),
                        unit: metric.canonicalUnit,
                        rawPayload: sample, // Store individual sample, not entire payload
                    }

                    results.observations.push(obs);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown normalization error';
                    results.errors.push(`Failed to normalize Dexcom sample: ${errorMessage}`);
                }
            }
        }

        return results;
    }

    async execute(input: Input): Promise<Output> {
        const { payload, payloadFormat, manufacturer, metric } = input;

        switch (manufacturer.key) {
            case "apple_health":
                return this.normalizeAppleHealth(payload, payloadFormat, metric);
            case "dexcom":
                return this.normalizeDexcom(payload, payloadFormat, metric);
            default:
                return { observations: [], errors: ["Unable to find manufacturer handler"] };
        }
    }
}