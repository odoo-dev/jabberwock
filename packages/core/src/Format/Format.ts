export class Format {
    tagName = 'UNKNOWN-FORMAT';
    classes: Set<string>;
    constructor(className = '') {
        this.classes = new Set(className.split(' '));
    }
    get name(): string {
        return this.constructor.name;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    static parse(node: Node): Format | null {
        return null;
    }
    render(): Node {
        const element = document.createElement(this.tagName);
        const className = Array.from(this.classes).join(' ');
        if (className.length) {
            element.className = className;
        }
        return element;
    }
}
