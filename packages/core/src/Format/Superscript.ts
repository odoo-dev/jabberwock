import { Format } from './Format';

export class Superscript extends Format {
    tagName = 'SUP';
    static parse(node: Node): Superscript | null {
        return node.nodeName === 'SUP' ? new Superscript((node as Element).className) : null;
    }
}
