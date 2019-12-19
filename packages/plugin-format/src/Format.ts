import { JWPlugin, ParseMethod } from '../../core/src/JWPlugin';
import { formatMap } from './formatMap';
import { FormatAttribute } from './VNodes/FormatAttribute';
import { ParsingContext } from '../../core/src/Parser';

export class Format extends JWPlugin {
    static getParser(node: Node): ParseMethod {
        if (formatMap.tags.includes(node.nodeName)) {
            return Format.parse;
        }
    }
    static parsingContextHook(context: ParsingContext): ParsingContext {
        if (!context.node.childNodes.length && !context.node.nextSibling) {
            // Parse the next ancestor sibling in the ancestor tree, if any.
            let ancestor = context.node;
            // Climb back the ancestor tree to the first parent having a sibling.
            const rootNode = context.rootNode;
            do {
                ancestor = ancestor.parentNode;
                if (ancestor && formatMap.tags.includes(ancestor.nodeName)) {
                    formatMap.tags.forEach(tag => {
                        if (tag === ancestor.nodeName) {
                            // Remove the format.
                            context.attributes.delete(formatMap.fromTag(tag));
                        }
                    });
                }
            } while (ancestor && !ancestor.nextSibling && ancestor !== rootNode);
            return context;
        }
    }
    static parse(context: ParsingContext): ParsingContext {
        // Format nodes (e.g. B, I, U) are parsed differently than regular
        // elements since they are not represented by a proper VNode in our
        // internal representation but by the format of its children.
        // For the parsing, encountering a format node generates a new format
        // context which inherits from the previous one.
        const node = context.node;
        const isBold = !!context.attributes.get('bold') || node.nodeName === 'B';
        const isItalic = !!context.attributes.get('italic') || node.nodeName === 'I';
        const isUnderline = !!context.attributes.get('underline') || node.nodeName === 'U';
        context.attributes.set('bold', new FormatAttribute('bold', isBold));
        context.attributes.set('italic', new FormatAttribute('italic', isItalic));
        context.attributes.set('underline', new FormatAttribute('underline', isUnderline));
        return context;
    }
}
