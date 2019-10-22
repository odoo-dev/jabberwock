const formatToTag = {
    anchor: 'A',
    bold: 'B',
    italic: 'I',
    underlined: 'U',
};

const formatFromTag = {
    A: 'anchor',
    B: 'bold',
    STRONG: 'bold',
    EM: 'italic',
    I: 'italic',
    U: 'underlined',
};

const tags = Object.keys(formatFromTag);

export const Format = {
    tags: Object.freeze(tags),
    fromTag: (tag: string): string => formatFromTag[tag],
    toTag: (format: string): string => formatToTag[format],
};
