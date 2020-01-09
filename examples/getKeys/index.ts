import { TestMutationEvent } from '../../packages/core/test/EventNormalizer.test';
import { testContentNormalizer } from '../../packages/core/test/testContentNormalizer';
import {
    TestKeyboardEvent,
    TestInputEvent,
    TestSelectionEvent,
    TestCompositionEvent,
    TestEvent,
} from '../../packages/core/test/EventNormalizer.test';
const editable = document.querySelector('.editable');
const exportArea = document.querySelector('.exportArea');
const clearButton = document.querySelector('.clearButton');
const copyButton = document.querySelector('.copyButton');
const templatesElement = document.querySelector('.templates');

/**
 * When a mutation with removed nodes is triggered, the `index` of the removed nodes is imposible
 * to retrieve.
 * Each stack, reset the offsetCacheMap  (see `resetCurrentStack`).
 */
let offsetCacheMap: Map<Node, { index: number; parentId: string }>;

let currentEventStack = null;
let allEventStacks = [];

/**
 * Add `node` and all his `childNodes` recursively in the `offsetCacheMap`.
 */
function addNodeToOffsetCacheMap(node: Node): void {
    const parentChildNodes = Array.from(node.parentNode.childNodes);
    offsetCacheMap.set(node, {
        index: parentChildNodes.indexOf(node as ChildNode),
        parentId: (node.parentNode as HTMLElement).id,
    });
    node.childNodes.forEach(addNodeToOffsetCacheMap);
}
/**
 * Reset `offsetCacheMap`.
 */
function resetOffsetCacheMap(): void {
    offsetCacheMap = new Map();
    addNodeToOffsetCacheMap(editable);
}
Object.keys(testContentNormalizer).forEach(key => {
    const button = document.createElement('button');
    button.style.cursor = 'pointer';
    button.textContent = key;
    button.addEventListener('click', () => {
        editable.innerHTML = testContentNormalizer[key];
        setTimeout(clear, 10);
        resetOffsetCacheMap();
    });
    templatesElement.appendChild(button);
});

function registerTestEvent(testEvent: TestEvent): void {
    if (currentEventStack === null) {
        currentEventStack = [testEvent];
        allEventStacks.push(currentEventStack);
        // In concreet application, the operation between stacks might take time. When it the
        // operations between events takes more time +- 10ms, multiples event (e.g. multiples
        // keydown/keypress) are triggered in the same stack.
        // We setTimout with 10ms to handle theses case.
        setTimeout(resetCurrentStack, 10);
    } else {
        currentEventStack.push(testEvent);
    }
}
function resetCurrentStack(): void {
    currentEventStack = null;
    // refresh the offsetCacheMap between each stacks.

    resetOffsetCacheMap();
    renderAllStatcks();
}
function renderAllStatcks(): void {
    // When selecting with the mouse, there is many selection triggered which create
    // many stacks of selection that are useless.
    // The following lines remove the all the 'selection' event that happend between a serie of
    // 'selection' event.
    let consequentSelect = [];
    const eventToRemove = new Set();
    allEventStacks.forEach(stack => {
        return stack.filter(event => {
            if (event.type === 'selection') {
                consequentSelect.push(event);
            } else {
                consequentSelect = [];
            }
            if (consequentSelect.length >= 3) {
                eventToRemove.add(consequentSelect[consequentSelect.length - 2]);
            }
        });
    });
    const newEventStack = allEventStacks
        .map(stack => {
            return stack.filter(event => !eventToRemove.has(event));
        })
        .filter(stack => stack.length);
    console.log('newEventStack:', newEventStack);
    exportArea.textContent = JSON.stringify(newEventStack);
}
function logComposition(compositionEvent: CompositionEvent): void {
    const testCompositionEvent: TestCompositionEvent = {
        type: compositionEvent.type as 'compositionstart' | 'compositionupdate' | 'compositionend',
        data: compositionEvent.data,
    };
    registerTestEvent(testCompositionEvent);
}
function logInput(inputEvent: InputEvent): void {
    console.log('inputEvent:', inputEvent);
    const testInputEvent: TestInputEvent = {
        type: inputEvent.type as 'input' | 'beforeinput',
        data: inputEvent.data,
        inputType: inputEvent.inputType,
    };
    if (inputEvent.defaultPrevented) testInputEvent.defaultPrevented = true;

    registerTestEvent(testInputEvent);
}
function logKey(keyboardEvent: KeyboardEvent): void {
    const testKeyboardEvent: TestKeyboardEvent = {
        type: keyboardEvent.type as 'keyup' | 'keydown' | 'keypress',
        key: keyboardEvent.key,
        code: keyboardEvent.code,
    };
    if (keyboardEvent.ctrlKey) testKeyboardEvent.ctrlKey = true;
    if (keyboardEvent.metaKey) testKeyboardEvent.metaKey = true;
    if (keyboardEvent.altKey) testKeyboardEvent.altKey = true;
    if (keyboardEvent.shiftKey) testKeyboardEvent.shiftKey = true;
    if (keyboardEvent.defaultPrevented) testKeyboardEvent.defaultPrevented = true;
    registerTestEvent(testKeyboardEvent);
}
function logSelection(): void {
    const selection = document.getSelection();
    if (
        selection.focusNode === editable ||
        editable.contains(selection.focusNode) ||
        selection.anchorNode === editable ||
        editable.contains(selection.anchorNode)
    ) {
        const focusParent = selection.focusNode.parentElement;
        const anchorParent = selection.anchorNode.parentElement;
        const testSelectionEvent: TestSelectionEvent = {
            type: 'selection',
            focus: {
                id: focusParent.id,
                index: Array.prototype.indexOf.call(focusParent.childNodes, selection.focusNode),
                offset: selection.focusOffset,
            },
            anchor: {
                id: anchorParent.id,
                index: Array.prototype.indexOf.call(anchorParent.childNodes, selection.anchorNode),
                offset: selection.anchorOffset,
            },
        };
        registerTestEvent(testSelectionEvent);
    }
}
function logMutation(mutation: MutationRecord): void {
    console.log('mutation:', mutation);
    const offsetInfo = offsetCacheMap.get(mutation.target);
    const testMutationEvent: TestMutationEvent = {
        type: 'mutation',
        textContent: mutation.target.textContent,
        targetParentId: offsetInfo.parentId,
        targetIndex: offsetInfo.index,
    };
    const removedNodes = Array.from(mutation.removedNodes);
    const addedNodes = Array.from(mutation.addedNodes);
    if (removedNodes.length) {
        testMutationEvent.removedNodes = removedNodes.map((node: Node) => {
            const nodeInCache = offsetCacheMap.get(node);
            if (nodeInCache) {
                return nodeInCache;
            } else {
                return {
                    parentId: offsetCacheMap.get(mutation.previousSibling).parentId,
                    previousSiblingIndex: offsetCacheMap.get(mutation.previousSibling).index,
                };
            }
        });
    }
    if (addedNodes.length) {
        testMutationEvent.addedNodes = [];
        addedNodes.forEach((node: ChildNode) => {
            // sometimes mac safari does not provide parentNode.
            // if (node.parentNode === null) {
            testMutationEvent.addedNodes.push({
                parentId: offsetCacheMap.get(mutation.previousSibling).parentId,
                previousSiblingIndex: offsetCacheMap.get(mutation.previousSibling).index,
                nodeValue: (node as HTMLElement).outerHTML,
            });
            // }
            // else {
            //     throw new Error('an added node with a parentNode has been fond');
            // const childNodes = Array.from(node.parentNode.childNodes);
            // testMutationEvent.addedNodes.push({
            //     parentId: (node.parentNode as HTMLElement).id,
            //     index: childNodes.indexOf(node),
            // });
            // }
        });
    }
    registerTestEvent(testMutationEvent);
}
copyButton.addEventListener('click', () => {
    (exportArea as HTMLInputElement).select();
    document.execCommand('copy');
});
function clear(): void {
    console.clear();
    exportArea.textContent = '';
    currentEventStack = null;
    allEventStacks = [];
}
clearButton.addEventListener('click', clear);

editable.addEventListener('compositionstart', logComposition);
editable.addEventListener('compositionupdate', logComposition);
editable.addEventListener('compositioned', logComposition);
editable.addEventListener('keydown', logKey);
editable.addEventListener('keypress', logKey);
editable.addEventListener('keyup', logKey);
editable.addEventListener('beforeinput', logInput);
editable.addEventListener('input', logInput);
document.addEventListener('selectionchange', logSelection);

const observer = new MutationObserver((mutationsList): void => {
    console.log('mutationsList:', mutationsList);
    mutationsList.forEach(logMutation);
});
observer.observe(editable, {
    attributes: true,
    childList: true,
    subtree: true,
    characterDataOldValue: true,
    characterData: true,
});
