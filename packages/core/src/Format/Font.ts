import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Font: Format = {
    name: 'font',
    tagName: 'FONT',
    parse: (node): [FormatName, FormatInformation] => {
        if (node.nodeName === 'FONT') {
            return ['font', FormatManager.info('FONT', (node as Element).className)];
        }
    },
};
