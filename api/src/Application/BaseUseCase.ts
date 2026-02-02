export abstract class BaseUseCase<Params, Result> {
    abstract execute(params: Params): Promise<Result>;
}