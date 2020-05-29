import { VElement } from '../../core/src/VNodes/VElement';
import { OdooFieldInfo } from './OdooField';

export class OdooFieldNode extends VElement {
    fieldInfo: OdooFieldInfo;

    constructor(
        params: ConstructorParameters<typeof VElement>[0] & {
            fieldInfo: OdooFieldInfo;
        },
    ) {
        super(params);
        this.fieldInfo = params.fieldInfo;
    }

    /**
     * Return a new VNode with the same type and attributes as this OdooFieldNode.
     */
    clone(deepClone?: boolean, params?: {}): this {
        const defaults: ConstructorParameters<typeof OdooFieldNode>[0] = {
            htmlTag: this.htmlTag,
            fieldInfo: this.fieldInfo,
        };
        return super.clone(deepClone, { ...defaults, ...params });
    }
}
