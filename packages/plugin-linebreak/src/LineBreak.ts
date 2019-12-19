import { JWPlugin, ParseMethod, RenderMethod } from '../../core/src/JWPlugin';
import { VNode } from '../../core/src/VNodes/VNode';
import { LineBreakNode } from './VNodes/LineBreakNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { ParsingContext } from '../../core/src/Parser';
import { utils } from '../../utils/src/utils';
import { RenderingContext } from '../../core/src/Renderer';

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
        return utils.parse(context, LineBreakNode);
    }
    /**
     * Render the VNode to the given format.
     *
     * @param [to] the name of the format to which we want to render (default:
     * html)
     */
    static render(context: RenderingContext): RenderingContext {
        context = VElement.render({ ...context });
        if (context.to === 'html' && !context.currentVNode.nextSibling()) {
            // If a LINE_BREAK has no next sibling, it must be rendered as two
            // BRs in order for it to be visible.
            context.parentNode.appendChild(document.createElement('br'));
        }
        return context;
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
