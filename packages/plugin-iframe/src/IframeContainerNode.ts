import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

export interface IframeNodeParams {
    src?: string;
}

export class IframeContainerNode extends ContainerNode {
    editable = false;
    breakable = false;
    src?: string;
    constructor(params?: IframeNodeParams) {
        super();
        if (params?.src) {
            this.src = params.src;
        }
    }
}
