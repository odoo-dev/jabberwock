import { Format } from '../plugin-inline/Format';

export class BoldFormat extends Format {
    constructor(htmlTag: 'B' | 'STRONG' = 'B') {
        super(htmlTag);
    }
}
