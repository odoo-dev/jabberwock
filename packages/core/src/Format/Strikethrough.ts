import { Format, FormatInformation, FormatName, FormatManager } from './FormatManager';

export const Strikethrough: Format = {
    name: 'strikethrough',
    tagName: 'S',
    parse: (node): [FormatName, FormatInformation] => {
        if (node.nodeName === 'S') {
            return ['strikethrough', FormatManager.info('S', (node as Element).className)];
        }
    },
};
