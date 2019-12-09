import { Format } from './Format';

export class Bold extends Format {
    tagName = 'B';
    static parse(node: Node): Bold | null {
        return node.nodeName === 'B' ? new Bold((node as Element).className) : null;
    }
}
