import { JWPlugin, ParseMethod, RenderMethod } from '../../core/src/JWPlugin';
import { VNode } from '../../core/src/VNodes/VNode';
import { LineBreakNode } from './VNodes/LineBreakNode';
import { HTMLRendering } from '../../core/src/BasicHtmlRenderingEngine';
import { VElement } from '../../core/src/VNodes/VElement';
import { ParsingContext } from '../../core/src/Parser';
import { utils } from '../../utils/src/utils';

export class LineBreak extends JWPlugin {
    static readonly nodes = [LineBreakNode];
    static getParser(node: Node): ParseMethod {
        if (node.nodeName === 'BR') {
            return LineBreak.parse;
        }
    }
    static getRenderer(node: VNode): RenderMethod {
        if (node instanceof LineBreakNode) {
            return LineBreak.render;
        }
    }
    static parse(context: ParsingContext): ParsingContext {
        return utils.contextToVNode(context, LineBreakNode);
    }
    /**
     * Render the VNode to the given format.
     *
     * @param [to] the name of the format to which we want to render (default:
     * html)
     */
    static render(node: LineBreakNode): HTMLRendering {
        const rendering = VElement.render(node);
        if (!node.nextSibling()) {
            // If a LINE_BREAK has no next sibling, it must be rendered as two
            // BRs in order for it to be visible.
            rendering.fragment.appendChild(document.createElement('br'));
        }
        return rendering;
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
