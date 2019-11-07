import { VNodeType } from './VNode';

const map = new Map();
map.set('Ctrl+Alt+&', {
    name: 'formatParagraph',
    arguments: [VNodeType.HEADING1],
});
map.set('Ctrl+Alt+é', {
    name: 'formatParagraph',
    arguments: [VNodeType.HEADING2],
});
map.set('Ctrl+Alt+"', {
    name: 'formatParagraph',
    arguments: [VNodeType.HEADING3],
});
map.set("Ctrl+Alt+'", {
    name: 'formatParagraph',
    arguments: [VNodeType.HEADING4],
});
map.set('Ctrl+Alt+(', {
    name: 'formatParagraph',
    arguments: [VNodeType.HEADING5],
});
map.set('Ctrl+Alt+§', {
    name: 'formatParagraph',
    arguments: [VNodeType.HEADING6],
});
map.set('Ctrl+Alt+à', {
    name: 'formatParagraph',
    arguments: [VNodeType.PARAGRAPH],
});
map.set('Ctrl+B', {
    name: 'applyFormat',
    arguments: {
        format: 'bold',
    },
});
map.set('Ctrl+I', {
    name: 'applyFormat',
    arguments: {
        format: 'italic',
    },
});
map.set('Ctrl+U', {
    name: 'applyFormat',
    arguments: {
        format: 'underline',
    },
});
export const defaultKeyMap = map;
