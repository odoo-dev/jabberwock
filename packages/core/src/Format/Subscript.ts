import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Subscript: Format = {
    name: 'subscript',
    tagName: 'SUB',
    parse: (node): [FormatName, FormatInformation] | null => {
        if (node.nodeName === 'SUB') {
            return ['subscript', FormatManager.info('SUB', (node as Element).className)];
        }
    },
};
