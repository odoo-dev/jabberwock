import JWEditor from '../../core/src/JWEditor';
import { List, ListParams } from './List';
import { ListType } from './ListNode';
import { Button } from '../../plugin-toolbar/src/Toolbar';

export const OrderedListButton: Button = {
    title: 'Toggle ordered list',
    class: 'fa-list-ol',
    commandId: 'toggleList',
    commandArgs: { type: ListType.ORDERED } as ListParams,
    selected: (editor: JWEditor): boolean => {
        const targetedNodes = editor.selection.range.targetedNodes();
        return targetedNodes.every(List.isInList.bind(List, ListType.ORDERED));
    },
};
export const UnorderedListButton: Button = {
    title: 'Toggle unordered list',
    class: 'fa-list-ul',
    commandId: 'toggleList',
    commandArgs: { type: ListType.UNORDERED } as ListParams,
    selected: (editor: JWEditor): boolean => {
        const targetedNodes = editor.selection.range.targetedNodes();
        return targetedNodes.every(List.isInList.bind(List, ListType.UNORDERED));
    },
};
export const CheckboxListButton: Button = {
    title: 'Toggle checkbox list',
    class: 'far fa-check-square',
    commandId: 'toggleList',
    commandArgs: { type: ListType.CHECKLIST } as ListParams,
    selected: (editor: JWEditor): boolean => {
        const targetedNodes = editor.selection.range.targetedNodes();
        return targetedNodes.every(List.isInList.bind(List, ListType.CHECKLIST));
    },
};
