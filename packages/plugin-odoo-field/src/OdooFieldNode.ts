import { VElement } from '../../core/src/VNodes/VElement';
import { OdooFieldInfo } from './OdooField';

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
