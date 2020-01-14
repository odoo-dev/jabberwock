import { TestMutationEvent } from '../../packages/core/test/EventNormalizer.test';
import {
    testContentNormalizer,
    addIdToRemainingElements,
    resetElementsIds,
} from '../../packages/core/test/eventNormalizerUtils';
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
 * This map store information of a node a specific time (before a stack and when node are added).
 * Each stack, reset the offsetCacheMap (see `resetCurrentStack`).
 * `parentId` is the attribute 'id' of the parent Node
 * `index` is the position of the `Node` inside `parentId`
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

    resetElementsIds(editable);
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
        return stack.forEach(event => {
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
    addIdToRemainingElements(editable);
    const offsetInfo = offsetCacheMap.get(mutation.target);
    if (!offsetInfo) debugger;

    const testMutationEvent: TestMutationEvent = {
        type: 'mutation',
        mutationType: mutation.type,
        // todo: this is not accurate. When there is two mutations of type characterData in the same
        //       stack, the textContent being set is not the proper one. We should watch on the
        //       next mutation of type 'charData' ang
        textContent: mutation.target.textContent,
        // if there is no offsetInfo, it means that we are on the root element
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
        // addedNodes.forEach((node: ChildNode) => {
        // if a node is an element and is added, we need to cache it in the offsetmap
        // because other mutation event might reference this added node in the same stack.
        // if (node.nodeType === Node.ELEMENT_NODE) {
        // addNodeToOffsetCacheMap(node);
        // }
        // });
        testMutationEvent.addedNodes = addedNodes.map((node: ChildNode) => {
            // if there is no nextSibling, it means that this is the last element.
            const nodeValue =
                (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).outerHTML) ||
                (node.nodeType === Node.TEXT_NODE && node.nodeValue);
            if (mutation.nextSibling) {
                // otherwise, we must get the reference from the previousSibling
                console.log('node.nodeType:', node.nodeType);
                const nodeInCache = offsetCacheMap.get(mutation.nextSibling);
                return {
                    parentId: nodeInCache.parentId,
                    nodeType: node.nodeType,
                    nextSiblingIndex: nodeInCache.index,
                    nodeValue: nodeValue,
                };
            } else if (mutation.previousSibling) {
                console.log('node.nodeType:', node.nodeType);
                const nodeInCache = offsetCacheMap.get(mutation.previousSibling);
                return {
                    parentId: nodeInCache.parentId,
                    nodeType: node.nodeType,
                    previousSiblingIndex: nodeInCache.index,
                    nodeValue: nodeValue,
                };
            } else {
                // debugger;
                console.log('node.nodeType:', node.nodeType);
                const nodeInCache = offsetCacheMap.get(node);
                return {
                    parentId: nodeInCache.parentId,
                    nodeType: node.nodeType,
                    nodeValue: nodeValue,
                };
            }
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
