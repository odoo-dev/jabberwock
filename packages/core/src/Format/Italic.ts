import { Format } from './Format';

export class Italic extends Format {
    tagName = 'I';
    static parse(node: Node): Italic | null {
        return node.nodeName === 'I' ? new Italic((node as Element).className) : null;
    }
}
