import { Format } from './Format';

export class Span extends Format {
    tagName = 'SPAN';
    static parse(node: Node): Span | null {
        if (node.nodeName === 'SPAN') {
            return new Span((node as Element).className);
        }
        return null;
    }
}
