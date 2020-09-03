import { TagNode, TagNodeParams } from '../../core/src/VNodes/TagNode';

export interface OdooStructureNodeParams extends TagNodeParams {
    xpath: string;
    viewId: string;
}
export class OdooStructureNode extends TagNode {
    xpath: string;
    viewId: string;
    breakable = false;

    constructor(params: OdooStructureNodeParams) {
        super(params);
        this.xpath = params.xpath;
        this.viewId = params.viewId;
    }
}
