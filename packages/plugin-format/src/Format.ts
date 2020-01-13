import { JWPlugin, ParseMethod } from '../../core/src/JWPlugin';
import { formatMap } from './formatMap';
import { FormatAttribute } from './VNodes/FormatAttribute';

export class Format extends JWPlugin {
    static getParser(node: Node): ParseMethod {
        if (formatMap.tags.includes(node.nodeName)) {
            return Format.parse;
        }
    }
    static parse(node: Node): Set<FormatAttribute> {
        // Format nodes (e.g. B, I, U) are parsed differently than regular
        // elements since they are not represented by a proper VNode in our
        // internal representation but by the format of its children.
        // For the parsing, encountering a format node generates a new format
        // context which inherits from the previous one.
        return new Set([
            new FormatAttribute('bold', node.nodeName === 'B'),
            new FormatAttribute('italic', node.nodeName === 'I'),
            new FormatAttribute('underline', node.nodeName === 'U'),
        ]);
    }
}
