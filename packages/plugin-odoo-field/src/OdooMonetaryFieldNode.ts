import { OdooFieldNode } from './OdooFieldNode';
import { OdooFieldInfo } from './OdooField';

export enum CurrencyPosition {
    BEFORE = 'BEFORE',
    AFTER = 'AFTER',
}

export interface OdooMonetaryFieldInfo extends OdooFieldInfo {
    currencyValue: string;
    currencyPosition: CurrencyPosition;
}

export class OdooMonetaryFieldNode<
    T extends OdooMonetaryFieldInfo = OdooMonetaryFieldInfo
> extends OdooFieldNode<T> {}
