import { VElement } from '../../core/src/VNodes/VElement';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class InputNode extends VElement {
    value: string;
    constructor(type?: string, name?: string, value?: string) {
        super({ htmlTag: 'INPUT' });
        this.inputName = name;
        this.inputType = type;
        this.value = value;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return the `name` attribute of this Input node.
     */
    get inputName(): string {
        return this.modifiers.find(Attributes)?.get('name') as string;
    }
    /**
     * Set the `name` attribute of this Input node.
     */
    set inputName(name: string) {
        this.modifiers.find(Attributes)?.set('name', name);
    }
    /**
     * Return the `type` attribute of this Input node.
     */
    get inputType(): string {
        return this.modifiers.find(Attributes)?.get('type') as string;
    }
    /**
     * Set the `type` attribute of this Input node.
     */
    set inputType(name: string) {
        this.modifiers.find(Attributes)?.set('type', name);
    }
}
