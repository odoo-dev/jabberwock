import { VNode } from '../../core/src/VNodes/VNode';
import { ReactiveValue } from '../../utils/src/ReactiveValue';

export class OdooFieldNode extends VNode {
    constructor(
        public originalTagName: string,
        public value: ReactiveValue<any>,
        public isValid: ReactiveValue<boolean>,
    ) {
        super();
    }
}
