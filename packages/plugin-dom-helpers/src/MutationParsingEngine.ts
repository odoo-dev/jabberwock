import { ParsingIdentifier } from '../../plugin-parser/src/ParsingEngine';
import { HtmlDomParsingEngine } from '../../plugin-html/src/HtmlDomParsingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';

export type HtmlNode = HTMLElement | CharacterData;

export class DomMutationParsingEngine<T extends HtmlNode = HtmlNode> extends HtmlDomParsingEngine<
    T
> {
    static readonly id: ParsingIdentifier = 'mutation/html';
    static extends = [HtmlDomParsingEngine.id, XmlDomParsingEngine.id];
    public getNode: (node: Node) => VNode[];

    async _parseItem(node: T): Promise<VNode[]> {
        if (this.getNode) {
            const alreadyExistNodes = this.getNode(node);
            if (alreadyExistNodes && alreadyExistNodes.length) {
                return alreadyExistNodes;
            } else {
                return super._parseItem(node);
            }
        } else {
            return super._parseItem(node);
        }
    }
}
