import { Format } from '../../plugin-inline/src/Format';

export class BoldFormat extends Format {
    constructor(htmlTag: 'B' | 'STRONG' = 'B') {
        super(htmlTag);
    }
}
