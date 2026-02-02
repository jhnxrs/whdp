export abstract class BaseEntity<T> {
    public id: string;
    protected props: T;

    constructor(props: T, id: string) {
        this.props = props;
        this.id = id;
    }

    abstract toPersist(): unknown;
}