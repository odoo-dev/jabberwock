import JWEditor, { Button } from '../core/src/JWEditor';
import { ItalicFormat } from './ItalicFormat';
import { FormatParams } from '../plugin-inline/Inline';

export const ItalicButton: Button = {
    title: 'Toggle italic',
    class: 'fa-italic',
    commandId: 'toggleFormat',
    commandArgs: { FormatClass: ItalicFormat } as FormatParams,
    selected: async (editor: JWEditor): Promise<boolean> =>
        editor.execCommand('query.isAllFormat', { FormatClass: ItalicFormat }),
};
