import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { InlineNode } from './InlineNode';
import { Predicate, VNode } from '../../core/src/VNodes/VNode';
import { Format } from './Format';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class FormatDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    predicate: Predicate<boolean | VNode> = InlineNode;
    async render(node: InlineNode): Promise<Node[]> {
        const inline = await this.super.render(node);
        return this.renderFormats(node.modifiers.filter(Format), inline);
    }
    /**
     * Render an inline node's formats and return them in a fragment.
     *
     * @param rendering
     */
    async renderFormats(formats: Format[], rendering: Node[]): Promise<Node[]> {
        const fragment = document.createDocumentFragment();
        let parent: Node = fragment;
        for (const value of Object.values(formats)) {
            const formatNode = value.render();
            parent.appendChild(formatNode);
            // Update the parent so the text is inside the format node.
            parent = formatNode;
        }
        for (const domChild of rendering) {
            parent.appendChild(domChild);
        }
        return Array.from(fragment.childNodes);
    }
}
