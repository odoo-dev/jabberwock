import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap, Parser } from '../core/src/Parser';
import { SpanFormat } from './SpanFormat';

export class Span extends JWPlugin {
    readonly parsingFunctions: Array<ParsingFunction> = [this.parse.bind(this)];
    parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeName === 'SPAN' || context.currentNode.nodeName === 'FONT') {
            const format = new SpanFormat(context.currentNode.nodeName as 'SPAN' | 'FONT');
            format.attributes = Parser.parseAttributes(context.currentNode);
            const newFormat = [...context.formats];
            newFormat.push(format);
            const newContext = { ...context };
            newContext.formats = newFormat;
            return [newContext, new Map()];
        }
    }
}
