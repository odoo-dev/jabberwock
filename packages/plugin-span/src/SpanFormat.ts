import { Format } from '../../core/src/Format';

export class SpanFormat extends Format {
    constructor(htmlTag: 'SPAN' | 'FONT' = 'SPAN') {
        super(htmlTag);
    }
}
