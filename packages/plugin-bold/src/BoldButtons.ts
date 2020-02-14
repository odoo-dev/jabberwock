import JWEditor from '../../core/src/JWEditor';
import { BoldFormat } from './BoldFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { Button } from '../../plugin-toolbar/src/Toolbar';

export const BoldButton: Button = {
    title: 'Toggle bold',
    class: 'fa-bold',
    commandId: 'toggleFormat',
    commandArgs: { FormatClass: BoldFormat } as FormatParams,
    selected: (editor: JWEditor): boolean => editor.plugins.get(Inline).isAllFormat(BoldFormat),
};
