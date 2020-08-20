import { Format } from '../../core/src/Format';
import { VersionableObject } from '../../core/src/Memory/VersionableObject';
import { ModifierPreserve } from '../../core/src/Modifier';

export class BootstrapButtonFormat extends Format {
    htmlTag = 'A';
    preserve = new VersionableObject({
        after: true,
        paragraphBreak: false,
        lineBreak: true,
    }) as ModifierPreserve;
}
