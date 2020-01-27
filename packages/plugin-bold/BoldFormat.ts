import { Format } from '../core/src/Format';

export class BoldFormat extends Format {
    name = 'bold';
    htmlTag: 'B' | 'STRONG';
    constructor(htmlTag: 'B' | 'STRONG' = 'B') {
        super();
        this.htmlTag = htmlTag;
    }
}
