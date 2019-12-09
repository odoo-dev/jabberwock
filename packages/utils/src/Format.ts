export interface FormatType {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    subscript?: boolean;
    superscript?: boolean;
    strong?: boolean;
    emphasis?: boolean;
}
const formatToTag = {
    bold: 'B',
    italic: 'I',
    underline: 'U',
    strikethrough: 'S',
    subscript: 'SUB',
    superscript: 'SUP',
    strong: 'STRONG',
    emphasis: 'EM',
};

const formatFromTag = {};
Object.keys(formatToTag).forEach(key => {
    formatFromTag[formatToTag[key]] = key;
});

const formats = Object.keys(formatToTag);
const tags = Object.values(formatToTag);

export const Format = {
    formats: Object.freeze(formats),
    tags: Object.freeze(tags),
    fromTag: (tag: string): string => formatFromTag[tag],
    toTag: (format: string): string => formatToTag[format],
};
