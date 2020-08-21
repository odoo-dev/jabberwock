import { Format } from '../../core/src/Format';

export class ButtonFormat extends Format {
    preserveAfterParagraphBreak = false;
    preserveAfterLineBreak = false;
    constructor() {
        super('BUTTON');
    }
}
