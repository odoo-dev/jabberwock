import { Format } from './Format';

export class Emphasis extends Format {
    tagName = 'EM';
    static parse(node: Node): Emphasis | null {
        return node.nodeName === 'EM' ? new Emphasis((node as Element).className) : null;
    }
}
