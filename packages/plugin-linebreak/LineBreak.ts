import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingContext, ParsingMap } from '../core/src/Parser';
import { LineBreakNode } from './LineBreakNode';
import { VNode } from '../core/src/VNodes/VNode';

export class LineBreak extends JWPlugin {
    readonly parsingFunctions = [this.parse.bind(this)];
    readonly renderingFunctions = {
        dom: this.renderToDom.bind(this),
    };
    commands = {
        insertLineBreak: {
            handler: this.insertLineBreak.bind(this),
        },
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeName === 'BR') {
            const node = context.currentNode;
            const domNodes = [node];
            if (!node.nextSibling) {
                // A <br/> with no siblings is there only to make its parent visible.
                // Consume it since it was just parsed as its parent element node.
                // TODO: do this less naively to account for formatting space.
                return [context, new Map([[context.parentVNode, domNodes]])];
            } else if (node.nextSibling.nodeName === 'BR' && !node.nextSibling.nextSibling) {
                // A trailing <br/> after another <br/> is there only to make its previous
                // sibling visible. Consume it since it was just parsed as a single BR
                // within our abstraction.
                // TODO: do this less naively to account for formatting space.
                context.currentNode = node.nextSibling;
                domNodes.push(node.nextSibling);
            }
            const parsedNode = new LineBreakNode();
            const parsingMap = new Map([[parsedNode, domNodes]]);
            context.parentVNode.append(parsedNode);
            return [context, parsingMap];
        }
    }
    /**
     * Render the VNode to the given format.
     */
    renderToDom(node: VNode, domParent: Node): Map<VNode, Node[]> {
        if (node.is(LineBreakNode)) {
            const br = document.createElement('br');
            domParent.appendChild(br);
            const domNodes: Node[] = [];
            domNodes.push(br);
            if (!node.nextSibling()) {
                // If a LineBreakNode has no next sibling, it must be rendered
                // as two BRs in order for it to be visible.
                const br2 = document.createElement('br');
                domParent.appendChild(br2);
                domNodes.push(br2);
            }
            return new Map([[node, domNodes]]);
        }
    }
    /**
     * Insert a line break node at range.
     */
    insertLineBreak(): void {
        this.editor.vDocument.insert(new LineBreakNode());
    }
}
