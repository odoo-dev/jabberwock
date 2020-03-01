import { VNode } from '../../core/src/VNodes/VNode';
import { ParsingEngine, ParsingIdentifier, Parser } from './ParsingEngine';

export abstract class AbstractParser<T = {}> implements Parser<T> {
    static id: ParsingIdentifier;
    readonly engine: ParsingEngine<T>;
    constructor(engine: ParsingEngine<T>) {
        this.engine = engine;
    }
    predicate?: (item: T) => boolean;
    abstract async parse(item: T): Promise<VNode[]>;
}
