import { VElement } from '../../core/src/VNodes/VElement';
import { OdooFieldInfo } from './OdooField';
import JWEditor from '../../core/src/JWEditor';

export class OdooFieldNode extends VElement {
    // editor: JWEditor;
    // public component = true;
    constructor(
        public htmlTag: string,
        // todo: change name
        public fieldInfo: OdooFieldInfo,
        public options = {},
    ) {
        super(htmlTag);
    }
}
