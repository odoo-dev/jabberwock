import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Italic: Format = {
    name: 'italic',
    tagName: 'I',
    parse: (node): [FormatName, FormatInformation] => {
        if (node.nodeName === 'I') {
            return ['italic', FormatManager.info('I', (node as Element).className)];
        }
    },
};
