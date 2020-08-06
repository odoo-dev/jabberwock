import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { FollowRangeZoneNode } from './FollowRangeZoneNode';
import { targetDeepest } from '../../utils/src/Dom';

import '../assets/FollowRange.css';

export class FollowRangeZoneDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = FollowRangeZoneNode;

    async render(node: FollowRangeZoneNode): Promise<DomObject> {
        if (node.hasChildren()) {
            let debounce: number;
            let followRangeDebounced: () => void;
            const followRange: DomObject = {
                tag: 'JW-FOLLOW-RANGE',
                children: node.children(),
                attributes: { style: { 'display': 'none' } },
                attach: (el: HTMLElement): void => {
                    followRangeDebounced = (): void => {
                        window.clearTimeout(debounce);
                        debounce = window.setTimeout(
                            this._followChangedSelection.bind(this, el),
                            3,
                        );
                    };
                    document.addEventListener('selectionchange', followRangeDebounced, false);
                    window.addEventListener('resize', followRangeDebounced);
                },
                detach: (): void => {
                    document.removeEventListener('selectionchange', followRangeDebounced, false);
                    window.removeEventListener('resize', followRangeDebounced);
                },
            };
            return followRange;
        } else {
            return { children: [] };
        }
    }

    private _followChangedSelection(container: HTMLElement): void {
        let selection: Selection;
        let doc: Document | ShadowRoot = document;
        let isCollapsed = true;
        do {
            selection = doc.getSelection();
            doc = null;
            // don't use selection.isCollapsed because in shadowRoot the value
            // is every time true.
            isCollapsed =
                selection.anchorNode === selection.focusNode &&
                selection.anchorOffset === selection.focusOffset;
            if (selection.rangeCount && isCollapsed) {
                const [el] = targetDeepest(selection.anchorNode, selection.anchorOffset);
                if (el instanceof Element && el.shadowRoot) {
                    doc = el.shadowRoot;
                }
            }
        } while (doc);
        const selectionIsInEditable =
            !!selection &&
            selection.anchorNode &&
            selection.anchorNode.parentElement.closest('[contenteditable="true"]');

        // If the selection goes into an input inside the jw-follow-range, do nothing.
        if (
            document.activeElement instanceof HTMLInputElement &&
            document.activeElement.closest('JW-FOLLOW-RANGE')
        ) {
            return;
        }

        if (selection.rangeCount && !isCollapsed && selectionIsInEditable) {
            if (container.parentElement.tagName !== 'BODY') {
                document.body.append(container);
            }
            container.style.display = '';
            const size = container.getBoundingClientRect();
            const range = selection.getRangeAt(0);
            const box = range.getBoundingClientRect();
            container.style.top = window.scrollY + box.top - size.height + 'px';
            let leftPosition = box.left + (box.width - size.width) / 2;
            leftPosition = Math.max(0, leftPosition);
            container.style.left = leftPosition + 'px';
        } else if (container.style.display !== 'none') {
            // Use condition to have the minimum of mutations.
            container.style.display = 'none';
        }
    }
}
