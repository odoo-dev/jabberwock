import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Underline: Format = {
    name: 'underline',
    tagName: 'U',
    parse: (node): [FormatName, FormatInformation] => {
        if (node.nodeName === 'U') {
            return ['underline', FormatManager.info('U', (node as Element).className)];
        }
    },
};
