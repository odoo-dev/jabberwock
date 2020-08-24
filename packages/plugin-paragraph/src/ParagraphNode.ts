import { VElement } from '../../core/src/VNodes/VElement';

export class ParagraphNode extends VElement {
    mayContainContainers = false;
    constructor() {
        super({ htmlTag: 'P' });
    }
}
