import JWEditor from '../../core/src/JWEditor';
import { UnderlineFormat } from './UnderlineFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { Button } from '../../plugin-toolbar/src/Toolbar';

export const UnderlineButton: Button = {
    title: 'Toggle underline',
    class: 'fa-underline',
    commandId: 'toggleFormat',
    commandArgs: { FormatClass: UnderlineFormat } as FormatParams,
    selected: (editor: JWEditor): boolean =>
        editor.plugins.get(Inline).isAllFormat(UnderlineFormat),
};
