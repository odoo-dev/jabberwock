import { OdooFieldNode, OdooFieldNodeParams } from './OdooFieldNode';
export enum OdooFieldNodeCurrencyPosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
}

export interface OMonetaryFieldNodeParams extends OdooFieldNodeParams {
    currencyValue: string;
    currencyPosition: OdooFieldNodeCurrencyPosition;
}

export class OMonetaryFieldNode extends OdooFieldNode {
    currencyValue: string;
    currencyPosition: OdooFieldNodeCurrencyPosition;

    constructor(params: OMonetaryFieldNodeParams) {
        super(params);
        this.currencyPosition = params.currencyPosition;
        this.currencyValue = params.currencyValue;
    }
}
