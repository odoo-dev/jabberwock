import { CaretPosition } from '../../plugin-dom-editable/src/EventNormalizer';
import { targetDeepest } from './Dom';
import { getDocument, isInstanceOf } from './utils';

export function elementFromPoint(
    x: number,
    y: number,
    root: Document | ShadowRoot = document,
): Node {
    let element = root.elementFromPoint(x, y);
    if (element) {
        root = element.ownerDocument;
        while (element.shadowRoot) {
            root = element.shadowRoot;
            element = root.elementFromPoint(x, y);
            if (element.shadowRoot === root) {
                if (root.firstElementChild) {
                    element = root.lastElementChild;
                    if (element.getBoundingClientRect().x > x) {
                        element = root.firstElementChild;
                    }
                } else {
                    break;
                }
            }
        }
        if (isInstanceOf(element, HTMLIFrameElement)) {
            const rect = element.getBoundingClientRect();
            return elementFromPoint(x - rect.x, y - rect.y, element.contentDocument);
        }
        return element;
    }
}

export function caretPositionFromPoint(
    x: number,
    y: number,
    root: Document | ShadowRoot = document,
): CaretPosition {
    if ((!x && x !== 0) || (!y && y !== 0)) return;

    // There is no cross-browser function for this, but the three functions below
    // cover all modern browsers as well as the shadow DOM.
    let caretPosition: CaretPosition;

    const element = elementFromPoint(x, y, root);

    if (!element) {
        return;
    }

    root = getDocument(element);
    if (root.caretPositionFromPoint) {
        caretPosition = root.caretPositionFromPoint(x, y);
        // Fire fox can return an object with offsetNode = null
    }
    if (!caretPosition?.offsetNode && root instanceof ShadowRoot) {
        // Find the nearest node leaf or char in leaf.
        const position = caretPositionFromPointInShadowDom(x, y, element);
        if (position) {
            caretPosition = {
                offsetNode: position.node,
                offset: position.offset,
            };
        }
    }
    if (!caretPosition?.offsetNode && root.caretRangeFromPoint) {
        const caretRange = root.caretRangeFromPoint(x, y);
        caretPosition = caretRange && {
            offsetNode: caretRange.startContainer,
            offset: caretRange.startOffset,
        };
    }
    if (caretPosition?.offsetNode) {
        const [offsetNode, offset] = targetDeepest(caretPosition.offsetNode, caretPosition.offset);
        return { offsetNode, offset };
    }
}

function caretPositionFromPointInShadowDom(
    x: number,
    y: number,
    element: Node,
): { node: Node; offset: number } {
    const range = document.createRange();
    let distX = Infinity;
    let distY = Infinity;
    let node: Node;
    let offset: number;

    const leafs: Node[] = [];
    const elements: Node[] = [element];
    while (elements.length) {
        const element = elements.shift();
        if (element.childNodes.length) {
            elements.push(...element.childNodes);
        } else {
            leafs.push(element);
        }
    }

    // Find the nearest node leaf.
    for (const leaf of leafs) {
        let box: DOMRect;
        if (isInstanceOf(leaf, Element)) {
            box = leaf.getBoundingClientRect();
        } else {
            range.setStart(leaf, 0);
            range.setEnd(leaf, leaf.textContent.length);
            box = range.getBoundingClientRect();
        }
        if (box.y + box.height < y) {
            continue;
        }

        let currentOffset = 0;
        let newDistY: number;
        if (box.y <= y && box.y + box.height >= y) {
            newDistY = 0;
            if (isInstanceOf(leaf, Text)) {
                currentOffset = getNearestCharOffset(x, y, leaf);
                range.setStart(leaf, currentOffset);
                range.setEnd(leaf, currentOffset);
                box = range.getBoundingClientRect();
            }
        } else {
            newDistY = Math.abs(box.y + box.height / 2 - y);
        }

        let newDistX: number;
        if (box.x <= x && box.x + box.width >= x) {
            newDistX = 0;
        } else {
            newDistX = Math.abs(box.x + box.width / 2 - x);
        }

        if (newDistY < distY) {
            distY = newDistY;
            distX = newDistX;
            node = leaf;
            offset = currentOffset;
        } else if (
            newDistY === distY &&
            ((newDistY === 0 && newDistX <= distX) || (newDistY !== 0 && newDistX > distX))
        ) {
            distY = newDistY;
            distX = newDistX;
            node = leaf;
            offset = currentOffset;
        }
        if (distX === 0 && distY === 0) {
            break;
        }
    }

    return node && { node, offset };
}

function getNearestCharOffset(x: number, y: number, text: Node): number {
    // Search with a pseudo dichotomic for performance.
    const range = document.createRange();
    const posToTest = [[0, text.textContent.length]];
    const verticalMatches: number[][] = [];
    while (posToTest.length) {
        const pos = posToTest.pop();
        range.setStart(text, pos[0]);
        range.setEnd(text, pos[1]);
        const box = range.getBoundingClientRect();

        if (box.y <= y && box.y + box.height >= y) {
            if (box.x <= x && box.x + box.width >= x) {
                if (pos[1] - pos[0] <= 1) {
                    return box.x + box.width / 2 <= x ? pos[1] : pos[0];
                }
                const alf = Math.floor((pos[0] + pos[1]) / 2);
                posToTest.push([pos[0], alf], [alf, pos[1]]);
            } else {
                verticalMatches.push(pos);
            }
        }
    }

    // Did not found the char, eg: user click on left above the container like
    // the browser we get the nearest char at the same cursor of the pointer.
    let dist = Infinity;
    let offset = 0;
    for (const pos of verticalMatches.reverse()) {
        for (let i = pos[0]; i < pos[1]; i++) {
            range.setStart(text, i);
            range.setEnd(text, i + 1);
            const box = range.getBoundingClientRect();
            const dx = box.x + box.width / 2;
            const dy = box.y + box.height / 2;
            const delta = Math.pow(dx - x, 2) + Math.pow(dy - y, 4);
            if (delta <= dist) {
                dist = delta;
                offset = i + (dx < x ? 1 : 0);
            }
        }
    }
    return offset;
}
