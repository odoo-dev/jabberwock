import { Format } from './Format';

export class Strikethrough extends Format {
    tagName = 'S';
    static parse(node: Node): Strikethrough | null {
        return node.nodeName === 'S' ? new Strikethrough((node as Element).className) : null;
    }
}
