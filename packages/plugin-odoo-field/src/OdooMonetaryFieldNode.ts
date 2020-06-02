import { OdooFieldNode } from './OdooFieldNode';
import { OdooFieldInfo } from './OdooField';
export enum OdooFieldNodeCurrencyPosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
}

export class OdooMonetaryFieldNode extends OdooFieldNode {
    currencyValue: string;
    currencyPosition: OdooFieldNodeCurrencyPosition;

    constructor(
        params: ConstructorParameters<typeof OdooFieldNode>[0] & {
            fieldInfo: OdooFieldInfo;
            currencyValue: string;
            currencyPosition: OdooFieldNodeCurrencyPosition;
        },
    ) {
        super(params);
        this.currencyPosition = params.currencyPosition;
        this.currencyValue = params.currencyValue;
    }
}
