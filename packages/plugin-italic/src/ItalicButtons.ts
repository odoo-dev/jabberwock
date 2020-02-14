import JWEditor from '../../core/src/JWEditor';
import { ItalicFormat } from './ItalicFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { Button } from '../../plugin-toolbar/src/Toolbar';

export const ItalicButton: Button = {
    title: 'Toggle italic',
    class: 'fa-italic',
    commandId: 'toggleFormat',
    commandArgs: { FormatClass: ItalicFormat } as FormatParams,
    selected: (editor: JWEditor): boolean => editor.plugins.get(Inline).isAllFormat(ItalicFormat),
};
