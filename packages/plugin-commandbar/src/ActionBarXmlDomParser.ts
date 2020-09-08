import { removeFormattingSpace } from '../../utils/src/formattingSpace';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { nodeName } from '../../utils/src/utils';
import { ActionBarNode } from './ActionBarNode';

export class ActionBarXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'T-ACTIONBAR';
    };

    async parse(item: Node): Promise<VNode[]> {
        return [new ActionBarNode()];
    }
}
