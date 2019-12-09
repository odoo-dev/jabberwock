import { Format } from './Format';

export class Subscript extends Format {
    tagName = 'SUB';
    static parse(node: Node): Subscript | null {
        return node.nodeName === 'SUB' ? new Subscript((node as Element).className) : null;
    }
}
