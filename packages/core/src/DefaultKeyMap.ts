const map = new Map();
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
