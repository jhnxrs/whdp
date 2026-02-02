import Container from "typedi";
import { TOKENS } from "src/Common/DI/Tokens";
import { DeviceRepository } from "src/Infra/Database/Repositories/DeviceRepository";
import { ManufacturerRepository } from "src/Infra/Database/Repositories/ManufacturerRepository";
import { MetricMappingRepository } from "src/Infra/Database/Repositories/MetricMappingRepository";
import { MetricRepository } from "src/Infra/Database/Repositories/MetricRepository";
import { NormalizePayloadUseCase } from "src/Application/UseCases/Ingestion/NormalizePayloadUseCase";
import { IngestNormalizedPayloadUseCase } from "src/Application/UseCases/Ingestion/IngestNormalizedPayloadUseCase";
import { ObservationRepository } from "src/Infra/Database/Repositories/ObservationRepository";
import { RawPayloadRepository } from "src/Infra/Database/Repositories/RawPayloadRepository";
import { DataStreamRepository } from "src/Infra/Database/Repositories/DataStreamRepository";
import { DataStreamDailyRollupRepository } from "src/Infra/Database/Repositories/DataStreamDailyRollupRepository";
import { IngestDataUseCase } from "src/Application/UseCases/Ingestion/IngestDataUseCase";
import { UserRepository } from "src/Infra/Database/Repositories/UserRepository";
import { DeviceAssignmentRepository } from "src/Infra/Database/Repositories/DeviceAssignmentRepository";
import { AssignDeviceToUserUseCase } from "src/Application/UseCases/Devices/AssignDeviceToUserUseCase";
import { CreateDeviceUseCase } from "src/Application/UseCases/Devices/CreateDeviceUseCase";
import { GetAssignmentHistoryUseCase } from "src/Application/UseCases/Devices/GetAssignmentHistoryUseCase";
import { GetUserDevicesUseCase } from "src/Application/UseCases/Devices/GetUserDevicesUseCase";
import { UnassignDeviceUseCase } from "src/Application/UseCases/Devices/UnassignDeviceUseCase";
import { GetUserRecentMetricsUseCase } from "src/Application/UseCases/Retrieval/GetUserRecentMetricsUseCase";
import { GetUserHistoricalMetricsUseCase } from "src/Application/UseCases/Retrieval/GetUserHistoricalMetricsUseCase";
import { GetUserAggregatedViewsUseCase } from "src/Application/UseCases/Retrieval/GetUserAggregatedViewsUseCase";

export const SetupRegistry = () => {
    // Repositories
    Container.set(TOKENS.DeviceRepository, new DeviceRepository());
    Container.set(TOKENS.ManufacturerRepository, new ManufacturerRepository());
    Container.set(TOKENS.MetricMappingRepository, new MetricMappingRepository());
    Container.set(TOKENS.MetricRepository, new MetricRepository());
    Container.set(TOKENS.ObservationRepository, new ObservationRepository());
    Container.set(TOKENS.RawPayloadRepository, new RawPayloadRepository());
    Container.set(TOKENS.DataStreamRepository, new DataStreamRepository());
    Container.set(TOKENS.DataStreamDailyRollupRepository, new DataStreamDailyRollupRepository());
    Container.set(TOKENS.UserRepository, new UserRepository());
    Container.set(TOKENS.DeviceAssignmentRepository, new DeviceAssignmentRepository());
    // UseCases
    Container.set(TOKENS.NormalizePayloadUseCase, new NormalizePayloadUseCase());
    Container.set(TOKENS.IngestNormalizedPayloadUseCase, new IngestNormalizedPayloadUseCase());
    Container.set(TOKENS.IngestDataUseCase, new IngestDataUseCase(
        Container.get<DeviceRepository>(TOKENS.DeviceRepository),
        Container.get<ManufacturerRepository>(TOKENS.ManufacturerRepository),
        Container.get<MetricRepository>(TOKENS.MetricRepository),
        Container.get<MetricMappingRepository>(TOKENS.MetricMappingRepository),
        Container.get<NormalizePayloadUseCase>(TOKENS.NormalizePayloadUseCase),
        Container.get<IngestNormalizedPayloadUseCase>(TOKENS.IngestNormalizedPayloadUseCase),
        Container.get<ObservationRepository>(TOKENS.ObservationRepository),
        Container.get<RawPayloadRepository>(TOKENS.RawPayloadRepository),
        Container.get<DataStreamRepository>(TOKENS.DataStreamRepository),
        Container.get<DataStreamDailyRollupRepository>(TOKENS.DataStreamDailyRollupRepository)
    ));
    Container.set(TOKENS.AssignDeviceToUserUseCase, new AssignDeviceToUserUseCase(
        Container.get<DeviceRepository>(TOKENS.DeviceRepository),
        Container.get<DeviceAssignmentRepository>(TOKENS.DeviceAssignmentRepository)
    ));
    Container.set(TOKENS.CreateDeviceUseCase, new CreateDeviceUseCase(
        Container.get<DeviceRepository>(TOKENS.DeviceRepository),
        Container.get<ManufacturerRepository>(TOKENS.ManufacturerRepository)
    ));
    Container.set(TOKENS.GetAssignmentHistoryUseCase, new GetAssignmentHistoryUseCase(
        Container.get<DeviceRepository>(TOKENS.DeviceRepository),
        Container.get<DeviceAssignmentRepository>(TOKENS.DeviceAssignmentRepository)
    ));
    Container.set(TOKENS.GetUserDevicesUseCase, new GetUserDevicesUseCase(
        Container.get<DeviceRepository>(TOKENS.DeviceRepository),
    ));
    Container.set(TOKENS.UnassignDeviceUseCase, new UnassignDeviceUseCase(
        Container.get<DeviceRepository>(TOKENS.DeviceRepository),
        Container.get<DeviceAssignmentRepository>(TOKENS.DeviceAssignmentRepository)
    ));
    Container.set(TOKENS.GetUserRecentMetricsUseCase, new GetUserRecentMetricsUseCase(
        Container.get<DataStreamRepository>(TOKENS.DataStreamRepository),
        Container.get<DataStreamDailyRollupRepository>(TOKENS.DataStreamDailyRollupRepository)
    ));
    Container.set(TOKENS.GetUserHistoricalMetricsUseCase, new GetUserHistoricalMetricsUseCase(
        Container.get<ObservationRepository>(TOKENS.ObservationRepository),
    ));
    Container.set(TOKENS.GetUserAggregatedViewsUseCase, new GetUserAggregatedViewsUseCase(
        Container.get<DataStreamRepository>(TOKENS.DataStreamRepository),
        Container.get<DataStreamDailyRollupRepository>(TOKENS.DataStreamDailyRollupRepository),
        Container.get<ObservationRepository>(TOKENS.ObservationRepository),
    ));
}