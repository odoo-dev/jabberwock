import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap, Parser } from '../core/src/Parser';
import { ItalicFormat } from './ItalicFormat';

export class Italic extends JWPlugin {
    readonly parsingFunctions: Array<ParsingFunction> = [this.parse.bind(this)];
    parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeName === 'I' || context.currentNode.nodeName === 'EM') {
            const format = new ItalicFormat(context.currentNode.nodeName as 'I' | 'EM');
            format.attributes = Parser.parseAttributes(context.currentNode);
            const newFormat = { ...context.format };
            newFormat[format.name] = format;
            const newContext = { ...context };
            newContext.format = newFormat;
            return [newContext, new Map()];
        }
    }
}
