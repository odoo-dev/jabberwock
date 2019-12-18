import { JWPlugin } from '../../core/src/JWPlugin';
import { LineBreakNode } from './VNodes/LineBreakNode';

export class LineBreak extends JWPlugin {
    static readonly nodes = [LineBreakNode];
    static parse(node: Node): LineBreakNode[] {
        if (node.nodeName === 'BR') {
            return [new LineBreakNode()];
        }
    }
    commands = {
        insertLineBreak: {
            handler: this.insertLineBreak.bind(this),
        },
    };

    /**
     * Insert a line break at range.
     */
    insertLineBreak(): void {
        this.editor.vDocument.insert(new LineBreakNode());
    }
}
