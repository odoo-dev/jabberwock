export type FormatName = string;

export class Format {
    name: FormatName;
    htmlTag: string;
    attributes: Map<string, string>;
    render(): Node {
        const node = document.createElement(this.htmlTag);
        if (this.attributes) {
            this.attributes.forEach((value: string, name: string) => {
                node.setAttribute(name, value);
            });
        }
        return node;
    }
}
