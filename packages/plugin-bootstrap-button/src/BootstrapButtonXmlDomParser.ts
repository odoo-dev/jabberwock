import { FormatXmlDomParser } from '../../plugin-inline/src/FormatXmlDomParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { BootstrapButtonFormat } from './BootstrapButtonFormat';
import { nodeName } from '../../utils/src/utils';
import { CharNode } from '../../plugin-char/src/CharNode';

export class BootstrapButtonXmlDomParser extends FormatXmlDomParser {
    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'A' && item.classList.contains('btn');
    };

    /**
     * Parse a bold node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const bootstrapButton = new BootstrapButtonFormat();
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            bootstrapButton.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        this.applyFormat(bootstrapButton, children);

        return [new CharNode({ char: '\u200B' }), ...children, new CharNode({ char: '\u200B' })];
    }
}
