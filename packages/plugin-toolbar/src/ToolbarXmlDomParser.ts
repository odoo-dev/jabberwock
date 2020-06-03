import { VNode } from '../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { ToolbarNode } from './ToolbarNode';
import { nodeName } from '../../utils/src/utils';
import { Toolbar } from './Toolbar';

export class ToolbarZoneXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'T-TOOLBAR';
    };

    async parse(item: Element): Promise<VNode[]> {
        const toolbar = new ToolbarNode();
        const nodes = await this.engine.parse(...item.childNodes);
        toolbar.append(...nodes);
        const toolbarPlugin = this.engine.editor.plugins.get(Toolbar);
        toolbarPlugin.addToolbarItems(toolbar, toolbarPlugin.configuration?.layout);
        return [toolbar];
    }
}
