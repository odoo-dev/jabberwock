import { VElement } from '../../core/src/VNodes/VElement';

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
        return this.attributes.name as string;
    }
    /**
     * Set the `name` attribute of this Input node.
     */
    set inputName(name: string) {
        this.attributes.name = name;
    }
    /**
     * Return the `type` attribute of this Input node.
     */
    get inputType(): string {
        return this.attributes.type as string;
    }
    /**
     * Set the `type` attribute of this Input node.
     */
    set inputType(name: string) {
        this.attributes.type = name;
    }
}
