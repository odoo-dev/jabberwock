export function argsRepr(args: {}): string {
    if (args === undefined) return '';
    return `{ ${Object.keys(args)
        .map(key => key + ': ' + args[key])
        .join(', ')} }`;
}
