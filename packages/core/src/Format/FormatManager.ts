import { Italic } from './Italic';
import { Bold } from './Bold';
import { Underline } from './Underline';
import { Strikethrough } from './Strikethrough';
import { Strong } from './Strong';
import { Subscript } from './Subscript';
import { Superscript } from './Superscript';
import { Emphasis } from './Emphasis';
import { Span } from './Span';

export interface FormatInformation {
    tagName: string;
    className: string;
}
export interface Format {
    name: string;
    tagName: string;
    parse: (node: Node) => [FormatName, FormatInformation];
}
export const defaultFormats = [
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Strong,
    Subscript,
    Superscript,
    Emphasis,
    Span,
];
export type FormatName = string;
export class FormatManager {
    formats: Set<Format> = new Set();
    constructor(replaceDefaultFormats?: Array<Format>) {
        this.addCustomFormats(replaceDefaultFormats || defaultFormats);
    }
    addCustomFormats(FormatClasses: Array<Format>): void {
        FormatClasses.forEach(FormatClass => {
            this.formats.add(FormatClass);
        });
    }
    isFormat(node: Node): boolean {
        return Array.from(this.formats).some(format => !!format.parse(node));
    }
    static info(tagName: string, className = ''): FormatInformation {
        return {
            tagName: tagName,
            className: className,
        };
    }
    find(name: FormatName): Format {
        return Array.from(this.formats).find(format => format.name === name);
    }
    create(name: FormatName, className = ''): FormatInformation {
        return FormatManager.info(this.find(name).tagName, className);
    }
    parse(node: Node): Map<FormatName, FormatInformation> {
        const parsedFormats: Map<FormatName, FormatInformation> = new Map();
        Array.from(this.formats).forEach(format => {
            const parsedFormat = format.parse(node);
            if (parsedFormat) {
                parsedFormats.set(parsedFormat[0], parsedFormat[1]);
            }
        });
        return parsedFormats;
    }
    get formatNames(): string[] {
        return Array.from(this.formats).map(format => format.name);
    }
    render(formatInformation: FormatInformation): Node {
        const element = document.createElement(formatInformation.tagName);
        const className = Array.from(new Set(formatInformation.className.split(' ')))
            .filter(item => item)
            .sort();
        if (className.length) {
            element.className = className.join(' ');
        }
        return element;
    }
}
