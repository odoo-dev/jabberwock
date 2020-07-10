import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
interface TextareaParams {
    value?: string;
}
export class TextareaNode extends AtomicNode {
    value = '';

    constructor(params?: TextareaParams) {
        super();
        this.value = (params && params.value) || '';
    }
}
