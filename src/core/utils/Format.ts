const formatToTag = {
    bold: 'B',
    italic: 'I',
    underline: 'U',
};

const formatFromTag = {};
Object.keys(formatToTag).forEach(key => {
    formatFromTag[formatToTag[key]] = key;
});

const tags = Object.keys(formatToTag).map(key => formatToTag[key]);

export const Format = {
    tags: Object.freeze(tags),
    fromTag: (tag: string): string => formatFromTag[tag],
    toTag: (format: string): string => formatToTag[format],
};
