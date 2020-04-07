import { VNode } from '../../core/src/VNodes/VNode';
import { OdooFieldInfo } from '../../plugin-odoo-reactive-registry/src/OdooReactiveRegistry';
import { VElement } from '../../core/src/VNodes/VElement';

export class OdooFieldNode extends VElement {
    constructor(
        public htmlTag: string,
        // todo: change name
        public fieldInfo: OdooFieldInfo,
        public options = {},
    ) {
        super(htmlTag);
    }
}
