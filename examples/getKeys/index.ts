import {
    TestEvent,
    TestCompositionEvent,
    TestInputEvent,
    TestKeyboardEvent,
    TestSelectionEvent,
    TestMutationEvent,
    testContentNormalizer,
    NodeIndexContainer,
    RemovedNodesTargetMutation,
    AddedNodesTargetMutation,
} from '../../packages/core/test/eventNormalizerUtils';
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

const nodeIndexContainer = new NodeIndexContainer(editable);
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
    console.log('compositionEvent:', compositionEvent);
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
        const testSelectionEvent: TestSelectionEvent = {
            type: 'selection',
            focus: {
                targetSelectionId: nodeIndexContainer.getId(selection.focusNode),
                offset: selection.focusOffset,
            },
            anchor: {
                targetSelectionId: nodeIndexContainer.getId(selection.anchorNode),
                offset: selection.anchorOffset,
            },
        };
        registerTestEvent(testSelectionEvent);
    }
}
function logMutation(mutation: MutationRecord): void {
    const testMutationEvent: TestMutationEvent = {
        type: 'mutation',
        mutationType: mutation.type,
        // todo: this is not accurate. When there is two mutations of type characterData in the same
        //       stack, the textContent being set is not the proper one. We should watch on the
        //       next mutation of type 'charData' ang
        textContent: mutation.target.textContent,
        targetId: nodeIndexContainer.getId(mutation.target),
    };
    const removedNodes = Array.from(mutation.removedNodes);
    const addedNodes = Array.from(mutation.addedNodes);
    if (removedNodes.length) {
        testMutationEvent.removedNodes = removedNodes.map((node: Node) => {
            const removeMutationInfo: RemovedNodesTargetMutation = {
                nodeId: nodeIndexContainer.getId(node),
            };
            return removeMutationInfo;
        });
    }
    if (addedNodes.length) {
        testMutationEvent.addedNodes = addedNodes.map((node: ChildNode) => {
            const nodeValue =
                (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).outerHTML) ||
                (node.nodeType === Node.TEXT_NODE && node.nodeValue);
            const existingId = nodeIndexContainer.getId(node);
            if (typeof existingId === 'number') {
                return {
                    parentId: nodeIndexContainer.getId(mutation.target),
                    nodeId: existingId,
                };
            } else {
                nodeIndexContainer.addIdToAllNodes(node);
                const addMutationInfo: AddedNodesTargetMutation = {
                    parentId: nodeIndexContainer.getId(mutation.target),
                    nodeValue: nodeValue,
                    nodeType: node.nodeType,
                };
                if (mutation.previousSibling) {
                    addMutationInfo.previousSiblingId = nodeIndexContainer.getId(
                        mutation.previousSibling,
                    );
                }
                if (mutation.nextSibling) {
                    addMutationInfo.nextSiblingId = nodeIndexContainer.getId(mutation.nextSibling);
                }
                return addMutationInfo;
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
    nodeIndexContainer.resetContainerElement();
    exportArea.textContent = '';
    currentEventStack = null;
    allEventStacks = [];
}

function setContentNormalizer(key): void {
    editable.innerHTML = testContentNormalizer[key];
    resetOffsetCacheMap();
    setTimeout(clear, 10);
}
Object.keys(testContentNormalizer).forEach(key => {
    const button = document.createElement('button');
    button.style.cursor = 'pointer';
    button.textContent = key;
    button.addEventListener('click', () => {
        nodeIndexContainer.resetContainerElement();
        setContentNormalizer(key);
    });
    templatesElement.appendChild(button);
});
// directly set the contentNormalizer
setContentNormalizer(Object.keys(testContentNormalizer)[0]);
clearButton.addEventListener('click', clear);

editable.addEventListener('compositionstart', logComposition);
editable.addEventListener('compositionupdate', logComposition);
editable.addEventListener('compositionend', logComposition);
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
