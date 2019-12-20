import { Attribute } from '../../../core/src/VNodes/Attribute';
import { formatMap } from '../formatMap';
import { RenderingContext } from '../../../core/src/Renderer';

export class FormatAttribute extends Attribute {
    render(context: RenderingContext): RenderingContext {
        const tag = formatMap.toTag(this.name);
        if (this.value) {
            const formatElement = document.createElement(tag);
            const parent = context.parentNode && context.parentNode.parentNode;
            // Make `formatElement` as parent of `context.parentNode`
            if (parent) {
                parent.insertBefore(formatElement, context.parentNode);
                formatElement.appendChild(context.parentNode);
            }
            context.parentNode = formatElement;
        }
        return context;
    }
    copy(): Attribute {
        return new FormatAttribute(this.name, this.value);
    }
}
