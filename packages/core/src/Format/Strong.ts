import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Strong: Format = {
    name: 'strong',
    tagName: 'STRONG',
    parse: (node): [FormatName, FormatInformation] | null => {
        if (node.nodeName === 'STRONG') {
            return ['strong', FormatManager.info('STRONG', (node as Element).className)];
        }
    },
};
