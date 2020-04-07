import { OdooFieldNode } from './OdooFieldNode';
import { OdooFieldInfo } from './OdooField';

export enum OdooFieldNodeCurrencyPosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
}

export class OdooFieldNodeCurrency extends OdooFieldNode {
    constructor(
        public htmlTag: string,
        // todo: check name
        public fieldInfo: OdooFieldInfo,
        public options: {
            currencyValue: string;
            currencyPosition: OdooFieldNodeCurrencyPosition;
        },
    ) {
        super(htmlTag, fieldInfo, options);
    }
}
