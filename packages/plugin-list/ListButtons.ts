import JWEditor, { Button } from '../core/src/JWEditor';
import { List, ListParams } from './List';
import { ListType } from './ListNode';

export const OrderedListButton: Button = {
    title: 'Toggle ordered list',
    class: 'fa-list-ol',
    commandId: 'toggleList',
    commandArgs: { type: 'ordered' } as ListParams,
    selected: async (editor: JWEditor): Promise<boolean> =>
        List.areInListType(
            List.getNodesToToggle(editor.vDocument.selection.range),
            ListType.ORDERED,
        ),
};
export const UnorderedListButton: Button = {
    title: 'Toggle unordered list',
    class: 'fa-list-ul',
    commandId: 'toggleList',
    commandArgs: { type: 'unordered' } as ListParams,
    selected: async (editor: JWEditor): Promise<boolean> =>
        List.areInListType(
            List.getNodesToToggle(editor.vDocument.selection.range),
            ListType.UNORDERED,
        ),
};
