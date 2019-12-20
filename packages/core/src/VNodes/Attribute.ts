import { RenderingContext } from '../Renderer';

export type AttributeName = string;
export type AttributeValue = string | boolean;
export class Attribute {
    name: AttributeName;
    value: AttributeValue;
    constructor(name: AttributeName, value: AttributeValue | string) {
        this.name = name;
        this.value = value;
    }
    render(context: RenderingContext): RenderingContext {
        if (this.value && context instanceof Element) {
            (context.parentNode as Element).setAttribute(this.name, this.value);
        }
        return context;
    }
    copy(): Attribute {
        return new Attribute(this.name, this.value);
    }
}
