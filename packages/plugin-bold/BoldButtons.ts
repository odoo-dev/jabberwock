import JWEditor, { Button } from '../core/src/JWEditor';
import { BoldFormat } from './BoldFormat';
import { FormatParams } from '../plugin-inline/Inline';
import { Char } from '../plugin-char/Char';

export const BoldButton: Button = {
    title: 'Toggle bold',
    class: 'fa-bold',
    commandId: 'toggleFormat',
    commandArgs: { FormatClass: BoldFormat } as FormatParams,
    selected: async (editor: JWEditor): Promise<boolean> => Char.isAllFormat(editor, BoldFormat),
};
