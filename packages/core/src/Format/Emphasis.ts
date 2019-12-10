import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Emphasis: Format = {
    name: 'emphasis',
    tagName: 'EM',
    parse: (node): [FormatName, FormatInformation] => {
        if (node.nodeName === 'EM') {
            return ['emphasis', FormatManager.info('EM', (node as Element).className)];
        }
    },
};
