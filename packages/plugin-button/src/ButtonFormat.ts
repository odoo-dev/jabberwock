import { Format } from '../../core/src/Format';
import { VersionableObject } from '../../core/src/Memory/VersionableObject';
import { ModifierPreserve } from '../../core/src/Modifier';

export class ButtonFormat extends Format {
    preserve = new VersionableObject({
        after: true,
        paragraphBreak: false,
        lineBreak: false,
    }) as ModifierPreserve;
    constructor() {
        super('BUTTON');
    }
}
