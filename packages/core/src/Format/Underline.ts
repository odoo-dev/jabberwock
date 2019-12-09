import { Format } from './Format';

export class Underline extends Format {
    tagName = 'U';
    static parse(node: Node): Underline | null {
        return node.nodeName === 'U' ? new Underline((node as Element).className) : null;
    }
}
