import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { FollowRangeZoneNode } from './FollowRangeZoneNode';

import '../assets/FollowRange.css';

export class FollowRangeZoneDomObjectRenderer extends AbstractRenderer<DomObject> {
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
                attach: (el: HTMLElement): void => {
                    followRangeDebounced = (): void => {
                        window.clearTimeout(debounce);
                        debounce = window.setTimeout(
                            this._followChangedSelection.bind(this, el),
                            3,
                        );
                    };
                    el.style.display = 'none';
                    document.addEventListener('selectionchange', followRangeDebounced, true);
                },
                detach: (el: HTMLElement): void => {
                    el.style.display = 'none';
                    document.removeEventListener('selectionchange', followRangeDebounced, true);
                },
            };
            return followRange;
        } else {
            return { children: [] };
        }
    }

    private _followChangedSelection(container: HTMLElement): void {
        const selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
            container.style.display = '';
            const size = container.getBoundingClientRect();
            const range = selection.getRangeAt(0);
            const box = range.getBoundingClientRect();
            container.style.top = box.top - size.height + 'px';
            container.style.left = box.left + (box.width - size.width) / 2 + 'px';
        } else if (container.style.display !== 'none') {
            // Use condition to have the minimum of mutations.
            container.style.display = 'none';
        }
    }
}
