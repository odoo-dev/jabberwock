import { VElement, VElementParams } from '../../core/src/VNodes/VElement';
import { OdooFieldInfo } from './OdooField';

export interface OdooFieldNodeParams extends VElementParams {
    fieldInfo: OdooFieldInfo;
}

export class OdooFieldNode extends VElement {
    fieldInfo: OdooFieldInfo;
    constructor(params: OdooFieldNodeParams) {
        super(params);
        this.fieldInfo = params.fieldInfo;
    }

    /**
     * Return a new VNode with the same type and attributes as this OdooFieldNode.
     */
    clone(): this {
        const clone = new this.constructor<typeof OdooFieldNode>({
            htmlTag: this.htmlTag,
            fieldInfo: this.fieldInfo,
        });
        clone.modifiers = this.modifiers.clone();
        return clone;
    }
}
