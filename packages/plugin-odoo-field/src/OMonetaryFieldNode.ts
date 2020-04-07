import { OdooFieldNode } from '../../OdooFieldNode';
import { OdooFieldInfo } from '../../OdooField';

export enum OdooFieldNodeCurrencyPosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
}

export class OMonetaryFieldNode extends OdooFieldNode {
    constructor(
        public htmlTag: string,
        public fieldInfo: OdooFieldInfo,
        public options: {
            currencyValue: string;
            currencyPosition: OdooFieldNodeCurrencyPosition;
        },
    ) {
        super(htmlTag, fieldInfo, options);
    }
}
