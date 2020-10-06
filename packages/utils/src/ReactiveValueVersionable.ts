import { makeVersionable } from '../../core/src/Memory/Versionable';
import { Constructor } from './utils';
import { ReactiveValue } from './ReactiveValue';

export class ReactiveValueVersionable<T> extends ReactiveValue<T> {
    constructor(...args: ConstructorParameters<Constructor<ReactiveValue<T>>>) {
        super(...args);
        return makeVersionable(this);
    }
}
