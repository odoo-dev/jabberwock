import { Format } from '../core/src/Format';

export class SpanFormat extends Format {
    name = 'span';
    htmlTag: 'SPAN' | 'FONT';
    constructor(htmlTag: 'SPAN' | 'FONT' = 'SPAN') {
        super();
        this.htmlTag = htmlTag;
    }
}
