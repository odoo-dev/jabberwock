import { VNode } from '../../core/src/VNodes/VNode';
import { ReactiveValue } from '../../utils/src/ReactiveValue';
import { OdooFieldNode } from './OdooFieldNode';

export enum OdooFieldNodeCurrencyPosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
}

export class OdooFieldNodeCurrency extends OdooFieldNode {
    constructor(
        public originalTagName: string,
        public value: ReactiveValue<any>,
        public isValid: ReactiveValue<boolean>,
        public currency: string,
        public currencyPosition: OdooFieldNodeCurrencyPosition,
    ) {
        super(originalTagName, value, isValid);
    }
}

export function isOdooFieldNodeCurrency(node: any): node is OdooFieldNodeCurrency {
    return node instanceof OdooFieldNodeCurrency;
}
