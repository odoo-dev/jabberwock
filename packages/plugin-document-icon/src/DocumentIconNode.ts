import { IconNode, IconNodeParams } from '../../plugin-icon/src/IconNode';

export interface DocumentNodeParams extends IconNodeParams {
    iconLink: string;
}
export class DocumentIconNode extends IconNode {
    static readonly atomic = true;
    public iconLink: string;

    constructor(params: DocumentNodeParams) {
        super(params);
        this.iconLink = params.iconLink;
    }
}
