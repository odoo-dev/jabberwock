import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { LineBreakNode } from './LineBreakNode';
import { createMap } from '../core/src/VDocumentMap';

export class LineBreak extends JWPlugin {
    commands = {
        insertLineBreak: {
            handler: this.insertLineBreak.bind(this),
        },
    };
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeName === 'BR') {
            return LineBreak.parse;
        }
    }
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        const node = context.currentNode;
        const domNodes = [node];
        if (!node.nextSibling) {
            // A <br/> with no siblings is there only to make its parent visible.
            // Consume it since it was just parsed as its parent element node.
            // TODO: do this less naively to account for formatting space.
            return [context, createMap([[context.parentVNode, node]])];
        } else if (node.nextSibling.nodeName === 'BR' && !node.nextSibling.nextSibling) {
            // A trailing <br/> after another <br/> is there only to make its previous
            // sibling visible. Consume it since it was just parsed as a single BR
            // within our abstraction.
            // TODO: do this less naively to account for formatting space.
            context.currentNode = node.nextSibling;
            domNodes.push(node.nextSibling);
        }
        const parsedNode = new LineBreakNode();
        const parsingMap = createMap([[parsedNode, domNodes]]);
        context.parentVNode.append(parsedNode);
        return [context, parsingMap];
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a line break node at range.
     */
    insertLineBreak(): void {
        this.editor.vDocument.insert(new LineBreakNode());
    }
}
