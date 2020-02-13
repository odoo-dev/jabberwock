import { AbstractRenderer } from '../core/src/AbstractRenderer';
import { LineBreakNode } from './LineBreakNode';

export class LineBreakDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    predicate = LineBreakNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: LineBreakNode): Promise<Node[]> {
        const br = document.createElement('br');
        for (const name of Object.keys(node.attributes)) {
            const value = node.attributes[name];
            if (typeof value === 'string') {
                br.setAttribute(name, value);
            }
        }
        const rendering = [br];
        if (!node.nextSibling()) {
            // If a LineBreakNode has no next sibling, it must be rendered
            // as two BRs in order for it to be visible.
            rendering.push(document.createElement('br'));
        }
        return rendering;
    }
}
