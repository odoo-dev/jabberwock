import { Format } from '../../core/src/Format';
import { ModifierLevel } from '../../core/src/Modifier';

export class UnderlineFormat extends Format {
    htmlTag = 'U';
    level = ModifierLevel.LOW;
}
