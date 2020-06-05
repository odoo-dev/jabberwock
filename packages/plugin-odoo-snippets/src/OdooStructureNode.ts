import { VElement, VElementParams } from '../../core/src/VNodes/VElement';

export interface OdooStructureNodeParams extends VElementParams {
    xpath: string;
    viewId: string;
}
export class OdooStructureNode extends VElement {
    xpath: string;
    viewId: string;

    constructor(params: OdooStructureNodeParams) {
        super(params);
        this.xpath = params.xpath;
        this.viewId = params.viewId;
    }
}
