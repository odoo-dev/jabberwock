import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Span: Format = {
    name: 'span',
    tagName: 'SPAN',
    parse: (node): [FormatName, FormatInformation] => {
        if (node.nodeName === 'SPAN') {
            return ['span', FormatManager.info('SPAN', (node as Element).className)];
        }
    },
};
