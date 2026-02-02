import { BaseUseCase } from "src/Application/BaseUseCase";
import { IngestNormalizedPayloadUseCase } from "src/Application/UseCases/Ingestion/IngestNormalizedPayloadUseCase";
import { NormalizedObservation, NormalizePayloadUseCase } from "src/Application/UseCases/Ingestion/NormalizePayloadUseCase";
import DataStream from "src/Domain/Entities/DataStream/Entity";
import DataStreamDailyRollup from "src/Domain/Entities/DataStreamDailyRollup/Entity";
import Manufacturer from "src/Domain/Entities/Manufacturer/Entity";
import Metric from "src/Domain/Entities/Metric/Entity";
import MetricMapping from "src/Domain/Entities/MetricMapping/Entity";
import Observation from "src/Domain/Entities/Observation/Entity";
import RawPayload from "src/Domain/Entities/RawPayload/Entity";
import { DataStreamDailyRollupRepository } from "src/Infra/Database/Repositories/DataStreamDailyRollupRepository";
import { DataStreamRepository } from "src/Infra/Database/Repositories/DataStreamRepository";
import { DeviceRepository } from "src/Infra/Database/Repositories/DeviceRepository";
import { ManufacturerRepository } from "src/Infra/Database/Repositories/ManufacturerRepository";
import { MetricMappingRepository } from "src/Infra/Database/Repositories/MetricMappingRepository";
import { MetricRepository } from "src/Infra/Database/Repositories/MetricRepository";
import { ObservationRepository } from "src/Infra/Database/Repositories/ObservationRepository";
import { RawPayloadRepository } from "src/Infra/Database/Repositories/RawPayloadRepository";

type ManufacturerPayload = Record<string, unknown>;

type NormalizePayloadsResult = {
    observations: NormalizedObservation[];
    errors: string[];
}

type Input = {
    userId: string;
    deviceId: string;
    // We accept manufacturerId here because it is a stable, predefined identifier
    // (e.g. "apple_health"), not a random value.
    // We could call it "source", but the naming here makes it easier
    manufacturerId: string;
    // We should not accept "payloadFormat" as input if this would be used
    // for actual clients.. Here we assume this is a pipeline used only
    // by the actual system
    payloadFormat: string;
    payload: ManufacturerPayload | ManufacturerPayload[];
};

type Output = {
    success: boolean;
    errors?: string[];
    ingested?: number;
    duplicates?: number;
};

/** 
 * This useCase will receive the raw vendor payload and the required information
 * so that it can process and store the data
 * 
 * The vendor information will be either collected by polling an API with OAuth
 * or maybe received via an endpoint..
 * (like Apple Health data would come from a mobile app probably)
*/

export class IngestDataUseCase implements BaseUseCase<Input, Output> {
    constructor(
        private readonly deviceRepository: DeviceRepository,
        private readonly manufacturerRepositoy: ManufacturerRepository,
        private readonly metricRepository: MetricRepository,
        private readonly metricMappingRepository: MetricMappingRepository,
        private readonly normalizePayloadUseCase: NormalizePayloadUseCase,
        private readonly ingestNormalizedPayloadUseCase: IngestNormalizedPayloadUseCase,
        private readonly observationRepository: ObservationRepository,
        private readonly rawPayloadRepository: RawPayloadRepository,
        private readonly dataStreamRepository: DataStreamRepository,
        private readonly dataStreamDailyRollupRepository: DataStreamDailyRollupRepository,
    ) { }

    private extractPayloadExternalCode(payload: ManufacturerPayload | ManufacturerPayload[], manufacturer: Manufacturer): string | undefined {
        /**
         * Todo: Handle scenario where payload is an array with different event types
         */
        const singlePayload = Array.isArray(payload) ? payload[0] : payload;

        switch (manufacturer.key) {
            case "apple_health":
                return (singlePayload?.type as string) || undefined;
            case "dexcom":
                return (singlePayload?.recordType as string) || undefined;
            default:
                return undefined;
        }
    }

    private async normalizePayloads(
        payloads: ManufacturerPayload[],
        payloadFormat: string,
        metric: Metric,
        manufacturer: Manufacturer,
    ): Promise<NormalizePayloadsResult> {
        const results: NormalizePayloadsResult = {
            errors: [],
            observations: []
        }

        for (const payload of payloads) {
            const normalized = await this.normalizePayloadUseCase.execute({
                manufacturer,
                metric,
                payload,
                payloadFormat
            });

            if (normalized.errors.length) {
                results.errors.push(...normalized.errors);
            }

            if (normalized.observations.length) {
                results.observations.push(...normalized.observations);
            }
        }

        return results;
    }

    private async ingestNormalizedPayloads(
        userId: string,
        deviceId: string,
        manufacturerId: string,
        observations: NormalizedObservation[],
        metric: Metric,
    ): Promise<Output> {
        // Use a single receivedAt timestamp for the entire batch
        // This ensures consistent RawPayload hashing and proper batch tracking
        const batchReceivedAt = new Date();

        const observationsToCreate: Observation[] = [];
        const streamTemplates = new Map<string, DataStream>();
        const streamUpdates = new Map<string, { lastObservationAt: Date; observationCount: number; }>();
        const rawPayloadsMap: Record<string, RawPayload> = {};

        for (const obs of observations) {
            const { observation, dataStream } = await this.ingestNormalizedPayloadUseCase.execute({
                userId,
                deviceId,
                manufacturerId,
                observation: obs,
                receivedAt: batchReceivedAt, // Pass consistent timestamp
            });

            observationsToCreate.push(observation);

            // Use batch receivedAt for consistent RawPayload hashing
            const rawPayloadHash = RawPayload.generateHash(
                {
                    manufacturerId,
                    receivedAt: batchReceivedAt,
                    payload: obs.rawPayload,
                }
            );

            if (rawPayloadsMap?.[rawPayloadHash]) {
                // raw payload already exists, just push the new obs id
                const rawPayload = rawPayloadsMap[rawPayloadHash];
                rawPayloadsMap[rawPayloadHash] = rawPayload.update({
                    derivedObservationIds: [...rawPayload.derivedObservationIds, observation.id]
                });
            } else {
                // raw payload does not exist yet, create it
                const rawPayload = RawPayload.create(
                    {
                        derivedObservationIds: [observation.id],
                        manufacturerId,
                        payload: obs.rawPayload,
                        payloadHash: rawPayloadHash,
                        receivedAt: batchReceivedAt
                    },
                    rawPayloadHash,
                );

                rawPayloadsMap[rawPayloadHash] = rawPayload;
            }

            // Keep only one template per stream ID
            if (!streamTemplates.has(dataStream.id)) {
                streamTemplates.set(dataStream.id, dataStream);
            }

            const currentStreamUpdate = streamUpdates.get(dataStream.id);

            const lastObservationAt = currentStreamUpdate ?
                obs.observedAt.getTime() > currentStreamUpdate.lastObservationAt.getTime() ? obs.observedAt
                    : currentStreamUpdate.lastObservationAt
                : obs.observedAt;

            streamUpdates.set(
                dataStream.id,
                {
                    lastObservationAt,
                    observationCount: (currentStreamUpdate?.observationCount || 0) + 1
                }
            );
        }

        /**
         * for the observations, we leave the deduplication for the database.
         * It will fail automatically if there is another document with
         * the same id (hash).
         *
         * we do this before updating streams/rollups to know which observations
         * are actually new vs duplicates.
         */
        const observationsGroupedByStreamId = observationsToCreate.reduce<Record<string, Observation[]>>((acc, obj) => {
            const key = obj.streamId;

            if (!acc[key]) {
                acc[key] = [];
            }

            acc[key].push(obj);
            return acc;
        }, {});

        const duplicatedObservationsIds = new Set<string>();

        for (const [streamId, obs] of Object.entries(observationsGroupedByStreamId)) {
            const { duplicates } = await this.observationRepository.createBatch(streamId, obs);
            duplicates.forEach(id => duplicatedObservationsIds.add(id));
        }

        // Calculate actual new observations per stream (excluding duplicates)
        const actualNewObservationsPerStream = new Map<string, { count: number; lastObservationAt: Date | null }>();

        for (const obs of observationsToCreate) {
            if (duplicatedObservationsIds.has(obs.id)) continue;

            const current = actualNewObservationsPerStream.get(obs.streamId);
            const lastObservationAt = current?.lastObservationAt
                ? (obs.observedAt > current.lastObservationAt ? obs.observedAt : current.lastObservationAt)
                : obs.observedAt;

            actualNewObservationsPerStream.set(obs.streamId, {
                count: (current?.count || 0) + 1,
                lastObservationAt,
            });
        }

        const streamsToUpdate: DataStream[] = [];

        for (const [streamId, template] of streamTemplates.entries()) {
            const newObsData = actualNewObservationsPerStream.get(streamId);
            if (!newObsData || newObsData.count === 0) continue;

            const existingStream = await this.dataStreamRepository.findById(streamId);

            if (existingStream) {
                const updatedLastObservationAt = existingStream.lastObservationAt
                    ? (newObsData.lastObservationAt && newObsData.lastObservationAt > existingStream.lastObservationAt
                        ? newObsData.lastObservationAt
                        : existingStream.lastObservationAt)
                    : newObsData.lastObservationAt;

                streamsToUpdate.push(existingStream.update({
                    lastObservationAt: updatedLastObservationAt,
                    observationCount: existingStream.observationsCount + newObsData.count
                }));
            } else {
                streamsToUpdate.push(template.update({
                    lastObservationAt: newObsData.lastObservationAt,
                    observationCount: newObsData.count
                }));
            }
        }

        if (streamsToUpdate.length > 0) {
            await this.dataStreamRepository.createBatch(streamsToUpdate);
        }

        // Upsert raw payloads
        const rawPayloads = Object.values(rawPayloadsMap);
        await this.rawPayloadRepository.createBatch(rawPayloads);

        /**
         * for each non-duplicated observation, we create/update the rollup
         *
         * Ideally in production this would be done by a cloud function with a trigger
         * or maybe a scheduled job using atomic increments.
         *
         * here we batch the updates by day to reduce DB operations.
         */
        const validObservations = observationsToCreate.filter(
            e => !duplicatedObservationsIds.has(e.id)
        );

        if (validObservations.length > 0) {
            const rollupGroups = new Map<string, Observation[]>();

            for (const obs of validObservations) {
                const day = obs.observedAt.toISOString().slice(0, 10); // YYYY-MM-DD
                const key = `${obs.streamId}_${day}`;

                if (!rollupGroups.has(key)) {
                    rollupGroups.set(key, []);
                }

                rollupGroups.get(key)!.push(obs);
            }

            // Process rollups in parallel for better performance
            const rollupPromises = Array.from(rollupGroups.entries()).map(async ([key, obs]) => {
                // Key format: streamId_YYYY-MM-DD, need to split carefully
                const lastUnderscoreIndex = key.lastIndexOf("_");
                const streamId = key.substring(0, lastUnderscoreIndex);
                const day = key.substring(lastUnderscoreIndex + 1);

                await this.updateRollup(streamId, day, obs, userId, deviceId, manufacturerId, metric);
            });

            await Promise.all(rollupPromises);

            // Only update device lastSeenAt if there were actual new observations
            await this.deviceRepository.updateLastSeen(deviceId);
        }

        const ingestedCount = observationsToCreate.length - duplicatedObservationsIds.size;

        return {
            success: true,
            duplicates: duplicatedObservationsIds.size,
            ingested: ingestedCount,
        }
    }

    private async updateRollup(
        streamId: string,
        day: string,
        observations: Observation[],
        userId: string,
        deviceId: string,
        manufacturerId: string,
        metric: Metric,
    ): Promise<void> {
        const existingRollup = await this.dataStreamDailyRollupRepository.findOne(streamId, day);

        let count = observations.length;
        let sum = 0;

        for (const obs of observations) {
            if (obs.value.numeric !== undefined) {
                sum += obs.value.numeric;
            } else if (obs.value.count !== undefined) {
                sum += obs.value.count;
            } else if (obs.value.duration !== undefined) {
                sum += obs.value.duration;
            }
        }

        const lastObservedAt = observations.reduce(
            (latest, o) =>
                !latest || o.observedAt > latest ? o.observedAt : latest,
            null as Date | null
        );

        const lastReceivedAt = observations.reduce(
            (latest, o) =>
                !latest || o.receivedAt > latest ? o.receivedAt : latest,
            null as Date | null
        );

        const firstObservedAt = observations.reduce(
            (earliest, o) =>
                !earliest || o.observedAt < earliest ? o.observedAt : earliest,
            null as Date | null
        );

        if (!existingRollup) {
            const rollup = DataStreamDailyRollup.create(
                {
                    streamId,
                    userId,
                    deviceId,
                    manufacturerId,
                    metricCode: metric.metricCode,

                    day,
                    dataType: metric.dataType,
                    unit: metric.canonicalUnit,

                    stats: {
                        count,
                        sum,
                    },

                    firstObservedAt,
                    lastObservedAt,
                    lastReceivedAt,
                },
                `${streamId}_${day}`
            );

            await this.dataStreamDailyRollupRepository.create(rollup);
        } else {
            // Determine correct lastObservedAt (compare with existing)
            const finalLastObservedAt = existingRollup.stats.count > 0
                ? (lastObservedAt && existingRollup.lastObservedAt
                    ? (lastObservedAt > existingRollup.lastObservedAt ? lastObservedAt : existingRollup.lastObservedAt)
                    : lastObservedAt || existingRollup.lastObservedAt)
                : lastObservedAt;

            const finalLastReceivedAt = lastReceivedAt && existingRollup.lastReceivedAt
                ? (lastReceivedAt > existingRollup.lastReceivedAt ? lastReceivedAt : existingRollup.lastReceivedAt)
                : lastReceivedAt || existingRollup.lastReceivedAt;

            const updated = existingRollup.update({
                stats: {
                    count: existingRollup.stats.count + count,
                    sum: (existingRollup.stats.sum ?? 0) + sum,
                },
                lastObservedAt: finalLastObservedAt,
                lastReceivedAt: finalLastReceivedAt,
            });

            await this.dataStreamDailyRollupRepository.update(updated);
        }
    }

    async execute(input: Input): Promise<Output> {
        const { userId, deviceId, payload, payloadFormat, manufacturerId } = input;

        /**
         * We start by validating the device & manufacturer
         * and linking the manufacturer to a metric
         */

        const device = await this.deviceRepository.findById(deviceId);

        if (!device) {
            throw new Error('Device not found');
        }

        if (!device.isAssignedToUser(userId)) {
            throw new Error('Device is not assigned to user');
        }

        const manufacturer = await this.manufacturerRepositoy.findById(manufacturerId);

        if (!manufacturer) {
            throw new Error('Manufacturer not found');
        }

        if (!manufacturer.isActive()) {
            throw new Error('Manufacturer is not active');
        }

        if (!manufacturer.acceptedPayloadFormats.includes(payloadFormat)) {
            throw new Error('Payload format is not supported for this manufacturer');
        }

        const externalCode = this.extractPayloadExternalCode(payload, manufacturer);

        if (!externalCode) {
            return {
                success: false,
                errors: [
                    'Unable to identify the type of payload for this manufacturer.'
                ]
            }
        }

        const metricMappingId = MetricMapping.generateId(manufacturerId, payloadFormat, externalCode);
        const metricMapping = await this.metricMappingRepository.findById(metricMappingId);

        console.log(metricMappingId);

        if (!metricMapping) {
            return {
                success: false,
                errors: [
                    'Unable to process this type of data for this specific manufacturer at this moment.'
                ]
            }
        }

        const metric = await this.metricRepository.findByMetricCode(metricMapping.metricCode);

        if (!metric) {
            // server error
            throw new Error('Metric not found');
        }

        /**
         * At this point, we have validated all the initial information
         * and we have the metric information for normalization
         * 
         * Now, we should normalize it, process it and
         * properly store all the information
         */

        const payloads = Array.isArray(payload) ? payload : [payload];

        const normalizationResults = await this.normalizePayloads(
            payloads,
            payloadFormat,
            metric,
            manufacturer
        );

        // If no valid observations were normalized, return errors
        if (normalizationResults.observations.length === 0) {
            return {
                success: false,
                errors: normalizationResults.errors.length > 0
                    ? normalizationResults.errors
                    : ['No valid observations found in payload']
            };
        }

        // Proceed with valid observations (partial success model)
        const result = await this.ingestNormalizedPayloads(
            userId,
            deviceId,
            manufacturerId,
            normalizationResults.observations,
            metric
        );

        // Include normalization errors in the response if there were any
        if (normalizationResults.errors.length > 0) {
            return {
                ...result,
                errors: normalizationResults.errors,
            };
        }

        return result;
    }
}