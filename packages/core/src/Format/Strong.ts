import { Format } from './Format';

export class Strong extends Format {
    tagName = 'STRONG';
    static parse(node: Node): Strong | null {
        return node.nodeName === 'STRONG' ? new Strong((node as Element).className) : null;
    }
}
