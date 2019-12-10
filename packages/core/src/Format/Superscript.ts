import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Superscript: Format = {
    name: 'superscript',
    tagName: 'SUP',
    parse: (node): [FormatName, FormatInformation] | null => {
        if (node.nodeName === 'SUP') {
            return ['superscript', FormatManager.info('SUP', (node as Element).className)];
        }
    },
};
