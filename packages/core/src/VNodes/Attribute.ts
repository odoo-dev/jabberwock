export type AttributeName = string;
export type AttributeValue = string | boolean;
export class Attribute {
    name: AttributeName;
    value: AttributeValue;
    constructor(name: AttributeName, value: AttributeValue | string) {
        this.name = name;
        this.value = value;
    }
    render(node: Node): Node {
        if (this.value && node instanceof Element) {
            node.setAttribute(this.name, this.value);
        }
        return node;
    }
    copy(): Attribute {
        return new Attribute(this.name, this.value);
    }
}
