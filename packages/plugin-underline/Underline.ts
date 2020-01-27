import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap, Parser } from '../core/src/Parser';
import { UnderlineFormat } from './UnderlineFormat';

export class Underline extends JWPlugin {
    readonly parsingFunctions: Array<ParsingFunction> = [this.parse.bind(this)];
    parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeName === 'U') {
            const format = new UnderlineFormat();
            format.attributes = Parser.parseAttributes(context.currentNode);
            const newFormat = { ...context.format };
            newFormat[format.name] = format;
            const newContext = { ...context };
            newContext.format = newFormat;
            return [newContext, new Map()];
        }
    }
}
