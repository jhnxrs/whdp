import { BaseUseCase } from "src/Application/BaseUseCase";
import { NormalizedObservation } from "src/Application/UseCases/Ingestion/NormalizePayloadUseCase";
import { IDataStream } from "src/Domain/Entities/DataStream/Contract";
import DataStream from "src/Domain/Entities/DataStream/Entity";
import { IMetric } from "src/Domain/Entities/Metric/Contract";
import Observation from "src/Domain/Entities/Observation/Entity";

type Input = {
    userId: string;
    deviceId: string;
    manufacturerId: string;
    observation: NormalizedObservation;
    receivedAt?: Date; // Optional: if not provided, uses current time
}

type Output = {
    observation: Observation;
    dataStream: DataStream;
}

export class IngestNormalizedPayloadUseCase implements BaseUseCase<Input, Output> {
    private inferStreamType(metricCode: IMetric.MetricCode): IDataStream.DataStreamType {
        switch (metricCode) {
            case "heart_rate":
            case "glucose":
                return "continuous";
            case "steps":
            case "calories":
                return "periodic";
            case "sleep_duration":
            case "weight":
                return "daily_summary";
            default:
                return "on_demand";
        }
    }

    async execute(input: Input): Promise<Output> {
        const { userId, deviceId, manufacturerId, observation: obs, receivedAt: inputReceivedAt } = input;

        const receivedAt = inputReceivedAt ?? new Date();
        const observedAt = new Date(obs.observedAt);

        const observationHash = Observation.generateHash(
            {
                userId,
                metricCode: obs.metricCode,
                observedAt,
                value: obs.value
            }
        );

        const streamId = DataStream.generateId(userId, deviceId, obs.metricCode);
        const stream = DataStream.create(
            {
                userId,
                deviceId,
                metricCode: obs.metricCode,
                endedAt: null,
                lastObservationAt: null,
                manufacturerId,
                observationCount: 0,
                startedAt: observedAt,
                status: IDataStream.DataStreamStatus.Active,
                type: this.inferStreamType(obs.metricCode),
            },
            streamId
        );

        const observation = Observation.create(
            {
                userId,
                deviceId,
                hash: observationHash,
                manufacturerId,
                metricCode: obs.metricCode,
                observedAt,
                receivedAt,
                source: obs.source,
                streamId,
                unit: obs.unit,
                value: obs.value
            },
            observationHash
        );

        return {
            observation,
            dataStream: stream,
        }
    }
}