import { Format } from './Format';

export class Font extends Format {
    tagName = 'FONT';
    static parse(node: Node): Font | null {
        if (node.nodeName === 'FONT') {
            return new Font((node as Element).className);
        }
        return null;
    }
}
