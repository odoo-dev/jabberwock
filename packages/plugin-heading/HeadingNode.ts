import { VElement } from '../core/src/VNodes/VElement';

export class HeadingNode extends VElement {
    level: number;
    constructor(level: number) {
        super('H' + level);
        this.level = level;
    }
    get name(): string {
        return super.name + ': ' + this.level;
    }
    static parse(node: Node): HeadingNode[] {
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.nodeName)) {
            return [new HeadingNode(parseInt(node.nodeName[1]))];
        }
    }
}
