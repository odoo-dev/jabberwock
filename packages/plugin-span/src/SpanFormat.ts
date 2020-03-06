import { Format } from '../../plugin-inline/src/Format';

export class SpanFormat extends Format {
    constructor(htmlTag: 'SPAN' | 'FONT' = 'SPAN') {
        super(htmlTag);
    }
}
