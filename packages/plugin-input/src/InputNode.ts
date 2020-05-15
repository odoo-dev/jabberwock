import { VElement } from '../../core/src/VNodes/VElement';

export class InputNode extends VElement {
    value: string;
    inputName: string;
    inputType: string;
    constructor(params: { type?: string; name?: string; value?: string } = {}) {
        super({ htmlTag: 'INPUT' });
        this.inputName = params.name;
        this.inputType = params.type;
        this.value = params.value;
    }
}
