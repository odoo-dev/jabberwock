import { VElement } from '../../core/src/VNodes/VElement';
import JWEditor from '../../core/src/JWEditor';

export interface InputNodeParams {
    inputType?: string;
    inputName?: string;
    value?: string;
    enabled?: (editor: JWEditor) => boolean;
    change?: (editor: JWEditor) => void;
    selected?: (editor: JWEditor) => void;
}

export class InputNode extends VElement {
    value: string;
    inputName: string;
    inputType: string;
    constructor(params: InputNodeParams = {}) {
        super({ htmlTag: 'INPUT' });
        this.inputName = params.inputName || '';
        this.inputType = params.inputType || 'text';
        this.value = params.value || '';
        if (params.enabled) this.change = params.enabled;
        if (params.change) this.change = params.change;
        if (params.selected) this.change = params.selected;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-empty-function
    change(editor: JWEditor): void {}

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enabled(editor: JWEditor): boolean {
        return true;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selected(editor: JWEditor): boolean {
        return true;
    }
}
