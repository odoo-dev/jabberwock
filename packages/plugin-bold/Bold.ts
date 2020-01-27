import { JWPlugin } from '../core/src/JWPlugin';
import { BoldFormat } from './BoldFormat';
import { Parser, ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { FormatParams } from '../core/src/CorePlugin';

export class Bold extends JWPlugin {
    readonly parsingFunctions: Array<ParsingFunction> = [this.parse.bind(this)];
    commandHooks = {
        applyFormat: this.applyFormat.bind(this),
    };
    parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeName === 'B' || context.currentNode.nodeName === 'STRONG') {
            const format = new BoldFormat(context.currentNode.nodeName as 'B' | 'STRONG');
            format.attributes = Parser.parseAttributes(context.currentNode);
            const newFormat = { ...context.format };
            newFormat[format.name] = format;
            const newContext = { ...context };
            newContext.format = newFormat;
            return [newContext, new Map()];
        }
    }
    /**
     * Apply the `format` to the range.
     *
     * If the range is collapsed, set the format on the range so we know in the next insert
     * which format should be used.
     */
    applyFormat(params: FormatParams): void {
        if (params.formatName === 'bold') {
            this.editor.vDocument.applyFormat(new BoldFormat());
        }
    }
}
