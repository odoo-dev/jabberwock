import { VElement } from '../../core/src/VNodes/VElement';
import { OdooFieldInfo } from './OdooField';
import { makeVersionable } from '../../core/src/Memory/Versionable';

export class OdooFieldNode<T extends OdooFieldInfo = OdooFieldInfo> extends VElement {
    fieldInfo: T;

    constructor(
        params: ConstructorParameters<typeof VElement>[0] & {
            fieldInfo: T;
        },
    ) {
        super(params);
        this.fieldInfo = makeVersionable(params.fieldInfo);
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
