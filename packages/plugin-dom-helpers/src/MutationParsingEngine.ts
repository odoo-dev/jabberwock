import { ParsingIdentifier } from '../../plugin-parser/src/ParsingEngine';
import { HtmlDomParsingEngine } from '../../plugin-html/src/HtmlDomParsingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { GetNodesFn } from './withDomMutations';

export type HtmlNode = HTMLElement | CharacterData;

export interface DomMutationParsingEngineParseOptions {
    getVNodes?: GetNodesFn;
}

export class DomMutationParsingEngine<T extends HtmlNode = HtmlNode> extends HtmlDomParsingEngine<
    T
> {
    static readonly id: ParsingIdentifier = 'mutation/html';
    static extends = [HtmlDomParsingEngine.id, XmlDomParsingEngine.id];
    public getNodes: (node: Node) => VNode[];

    async parseWithOptions(
        nodes: T[],
        options: DomMutationParsingEngineParseOptions,
    ): Promise<VNode[]> {
        this.getNodes = options.getVNodes;
        return this.parse(...nodes);
    }

    async _parseItem(node: T): Promise<VNode[]> {
        if (this.getNodes) {
            const alreadyExistNodes = this.getNodes(node);
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
