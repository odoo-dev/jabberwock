import { Attribute } from '../../../core/src/VNodes/Attribute';
import { formatMap } from '../formatMap';

export class FormatAttribute extends Attribute {
    render(rendered: Node[]): Node[] {
        const tag = formatMap.toTag(this.name);
        return rendered.map(node => {
            if (this.value) {
                const formatElement = document.createElement(tag);
                formatElement.appendChild(node);
                return formatElement;
            } else {
                return node;
            }
        });
    }
    copy(): Attribute {
        return new FormatAttribute(this.name, this.value);
    }
}
