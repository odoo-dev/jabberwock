import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Bold: Format = {
    name: 'bold',
    tagName: 'B',
    parse: (node): [FormatName, FormatInformation] => {
        if (node.nodeName === 'B') {
            return ['bold', FormatManager.info('B', (node as Element).className)];
        }
    },
};
