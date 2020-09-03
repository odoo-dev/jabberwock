import { TagNode } from '../../core/src/VNodes/TagNode';
import JWEditor from '../../core/src/JWEditor';

export interface InputNodeParams {
    inputType?: string;
    inputName?: string;
    value?: string;
    change?: (editor: JWEditor) => void;
}

export class InputNode extends TagNode {
    value: string;
    inputName: string;
    inputType: string;
    constructor(params: InputNodeParams = {}) {
        super({ htmlTag: 'INPUT' });
        this.inputName = params.inputName || '';
        this.inputType = params.inputType || 'text';
        this.value = params.value || '';
        if (params.change) this.change = params.change;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    change(editor: JWEditor): void {}
}
