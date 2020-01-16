import { EventBatch, EventNormalizer } from '../src/EventNormalizer';

/**
 * This mapping exist to ease the tests of the normalizer.
 * We use this dictionnary to:
 * - autofill editable in the normalizer tool
 * - set the content in the tests
 */
export const testContentNormalizer = {
    helloworld: `<p>Hey, hello world<br>Hillo world.</p>`,
    helloworldStyled: `<p>Hey, <b>hello</b> world</p>`,
    helloworldMutlistyled: `<p>Hey, <b>h<i>ell</i>o</b> world</p>`,
    hell: `<p>hell</p>`, // will be helloworld
    hello: `<p>hello</p>`, // will be helloworld
    ahello: `<p>a hello</p>`, // will be helloworld
    ahillo: `<p>a hillo</p>`, // will be helloworld
    hellototo: `<p>hello toto</p>`, // will be helloworld
    atestb: `<p>a test b</p>`, // will be helloworld
    atestbBold: `<p>a <b>test</b>, b</p>`, // will be helloworldStyled
    atestbcBold: `<p>a <b>test</b> b, c</p>`, // will be helloworldStyled
    multiStyled: `<p>a <b>t<u>e</u>s</b>t b</p>`, // will be helloworldMultistyled
    abcg: `<p>a <b>test</b> b, c<i>test</i> g</p>`, // will be helloworld
    multiline: `<p>abc<br/>def</p>`, // will be helloworld
    hellworld: `<p>hell<br/>world</p>`, // will be helloworld
};

export type TriggerNativeEventsOption =
    | MouseEventInit
    | KeyboardEventInit
    | CompositionEventInit
    | InputEventInit
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    | CustomEventInit<any>
    | EventInit
    | DragEventInit
    | ClipboardEventInit
    | TouchEventInit;

export interface TestKeyboardEvent {
    type: 'keydown' | 'keypress' | 'keyup';
    key: string;
    code: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
    defaultPrevented?: boolean;
}
export interface TestCompositionEvent {
    type: 'compositionstart' | 'compositionupdate' | 'compositionend';
    data: string;
}
export interface TestInputEvent {
    type: 'beforeinput' | 'input';
    // firefox does not provide data [or inputType, which is why theses key are optionnal
    data?: string;
    inputType?: string;
    defaultPrevented?: boolean;
}

// todo: Maybe remove this. It was introduced because of backward compatibility.
interface RemovedNodesTargetMutationIndex {
    parentId: string;
    index: number;
}
// todo: Remove this. It was introduced because of backward compatibility.
interface RemovedNodesTargetMutationOnlyID {
    id: string;
}

interface RemovedNodesTargetMutationPreviousSibling {
    parentId: string;
    previousSiblingIndex: number;
}
// interface TargetMutationPreviousSibling {
//     parentId: string;
//     previousSiblingIndex: number;
// }
export interface RemovedNodesTargetMutationId {
    nodeId: number;
    // todo: delete this key when all events are rewritten. It is there to distinguish the interface.
    mutationSpecType: 'id';
    // previousSiblingId?: number;
    // nextSiblingId?: number;
}

type RemovedNodesTargetMutation = (
    | RemovedNodesTargetMutationIndex
    | RemovedNodesTargetMutationOnlyID
    | RemovedNodesTargetMutationPreviousSibling
    | RemovedNodesTargetMutationId)[];

interface AddedNodesTargetMutationNoIndex {
    parentId: string;
    nodeType: number;
    nodeValue: string;
}
interface AddedNodesTargetMutationPreviousSibling {
    parentId: string;
    previousSiblingIndex: number;
    nodeType: number;
    nodeValue: string;
}
interface AddedNodesTargetMutationNextSibling {
    parentId: string;
    nextSiblingIndex: number;
    nodeType: number;
    nodeValue: string;
}

export interface AddedNodesTargetMutationId {
    parentId: number;
    nodeId?: number;
    // todo: delete this key when all events are rewritten. It is there to distinguish the interface.
    mutationSpecType: 'id';
    nodeValue?: string;
    // todo: check if we still need this key.
    nodeType?: number;
    previousSiblingId?: number;
    nextSiblingId?: number;
}
type AddedNodesTargetMutation = (
    | AddedNodesTargetMutationNoIndex
    | AddedNodesTargetMutationPreviousSibling
    | AddedNodesTargetMutationNextSibling
    | AddedNodesTargetMutationId)[];

export interface TestMutationEventToDelete {
    type: 'mutation';
    // todo: This is currently optionnal because of backward compatibility
    mutationType?: string;
    textContent: string;
    targetParentId?: string;
    targetIndex: number;
    removedNodes?: RemovedNodesTargetMutation;
    addedNodes?: AddedNodesTargetMutation;
}
export interface TestMutationEventNormal {
    type: 'mutation';
    mutationType?: string;
    textContent?: string;
    targetId?: number;
    removedNodes?: RemovedNodesTargetMutation;
    addedNodes?: AddedNodesTargetMutation;
}

export type TestMutationEvent = TestMutationEventToDelete | TestMutationEventNormal;
export interface TestSelectionEventNew {
    type: 'selection';
    focus: {
        targetSelectionId: number;
        offset: number;
    };
    anchor: {
        targetSelectionId: number;
        offset: number;
    };
}
// todo: to remove when all tests are replaced.
export interface TestSelectionEventOld {
    type: 'selection';
    focus: {
        id: string;
        index: number;
        offset: number;
    };
    anchor: {
        id: string;
        index: number;
        offset: number;
    };
}
export type TestSelectionEvent = TestSelectionEventNew | TestSelectionEventOld;

export type TestEvent =
    | TestKeyboardEvent
    | TestCompositionEvent
    | TestInputEvent
    | TestMutationEvent
    | TestSelectionEvent;

/**
 * Get the event type based on its name.
 *
 * @private
 * @param {string} eventName
 * @returns string
 *  'mouse' | 'keyboard' | 'unknown'
 */
export function _eventType(eventName: string): string {
    const types = {
        MouseEvent: ['click', 'mouse', 'pointer', 'contextmenu', 'select', 'wheel'],
        CompositionEvent: ['composition'],
        InputEvent: ['input'],
        KeyboardEvent: ['key'],
        DragEvent: ['dragstart', 'dragend', 'drop'],
        ClipboardEvent: ['beforecut', 'cut', 'paste'],
        TouchEvent: ['touchstart', 'touchend'],
    };
    let type = 'unknown';
    Object.keys(types).forEach(function(key) {
        const isType = types[key].some(function(str) {
            return eventName.toLowerCase().indexOf(str) !== -1;
        });
        if (isType) {
            type = key;
        }
    });
    return type;
}
class InputEventBis extends InputEvent {
    eventInitDict: InputEventInit;
    constructor(type: string, eventInitDict?: InputEventInit) {
        super(type, eventInitDict);
        this.eventInitDict = eventInitDict;
    }
    get inputType(): string {
        return this.eventInitDict.inputType;
    }
}
/**
 * Trigger events natively on the specified target.
 *
 * @param {node} el
 * @param {string} eventName
 * @param {object} [options]
 * @returns {Promise <Event>}
 */
export function triggerEvent(
    el: Node,
    eventName: string,
    options: TriggerNativeEventsOption,
): Event {
    if (!el) {
        console.warn('Try to trigger an event on an undefined node');
        return;
    }
    el = (el as HTMLElement).tagName ? el : el.parentNode;
    if (!el.parentNode) {
        console.warn('Try to trigger an event on a node out of the DOM');
        return;
    }
    options = Object.assign(
        {
            view: window,
            bubbles: true,
            cancelable: true,
        },
        options,
    );
    const type = _eventType(eventName);
    let ev: Event;
    switch (type) {
        case 'MouseEvent':
            ev = new MouseEvent(eventName, options);
            break;
        case 'KeyboardEvent':
            ev = new KeyboardEvent(eventName, options);
            break;
        case 'CompositionEvent':
            ev = new CompositionEvent(eventName, options);
            break;
        case 'DragEvent':
            ev = new DragEvent(eventName, options);
            break;
        case 'ClipboardEvent':
            if (!('clipboardData' in options)) {
                throw new Error('Wrong test');
            }
            ev = new ClipboardEvent(eventName, options);
            break;
        case 'InputEvent':
            ev = new InputEventBis(eventName, options);
            break;
        case 'TouchEvent':
            ev = new TouchEvent(eventName, options);
            break;
        default:
            ev = new Event(eventName, options);
            break;
    }
    el.dispatchEvent(ev);
    return ev;
}
export function setRange(
    startContainer: Node,
    startOffset: number,
    endContainer: Node,
    endOffset: number,
): void {
    const doc = startContainer.ownerDocument;
    const selection = doc.getSelection();
    if (selection.rangeCount) {
        const domRange: Range = selection.getRangeAt(0);
        domRange.setStart(startContainer, startOffset);
        domRange.collapse(true);
    } else {
        const domRange: Range = doc.createRange();
        domRange.setStart(startContainer, startOffset);
        domRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(domRange);
    }
    selection.extend(endContainer, endOffset);
}

export async function nextTick(): Promise<void> {
    return await new Promise((resolve): number => setTimeout(resolve));
}

export class NodeIndexContainer {
    lastNodeId: number;
    nodeIdMap: Map<Node, number>;
    idNodeMap: Map<number, Node>;
    containerElement: Element;

    constructor(editable: Element) {
        this.containerElement = editable;

        this.addIdToAllNodes = this.addIdToAllNodes.bind(this);
        this.resetContainerElement = this.resetContainerElement.bind(this);

        this.resetContainerElement();
    }

    addIdToAllNodes(node: Node): void {
        if (!this.nodeIdMap.get(node)) {
            const newId = this.lastNodeId++;
            this.nodeIdMap.set(node, newId);
            this.idNodeMap.set(newId, node);
        }
        node.childNodes.forEach(this.addIdToAllNodes);
    }
    resetContainerElement(): void {
        this.lastNodeId = 0;
        this.nodeIdMap = new Map<Node, number>();
        this.idNodeMap = new Map<number, Node>();
        this.addIdToAllNodes(this.containerElement);
    }
    getId(node: Node): number {
        return this.nodeIdMap.get(node);
    }
    getNode(id: number): Node {
        return this.idNodeMap.get(id);
    }
}

/**
 * For each `eventStackList` in `triggerEvents()`, we need to retrieve information of the `index`
 * that is contained within a `parent` that has an `id`.
 * It is possible that within the `eventStackList` loop, childs of a node are removed. However,
 * the index of a childNode within his parent is encoded relative to the beggining of the stack
 * when all nodes were still preset.
 *
 * For that reason we cannot retrieve a childNode with `parent.childNodes[index]` but we must do
 * `offsetCacheMap[parentId + '$' + index]`.
 *
 * Encode the key of the offsetCacheMap with "<parentId>$<childIndex>" (e.g. if the parent id is
 * 'a' and the offset is 0, the key will be encoded as "a$0").
 */
let offsetCacheMap: { [key: string]: Node };
/**
 * Add all childNodes of node retursively in `offsetCacheMap`.
 */
export function addNodeToOffsetCacheMap(node: Node): void {
    if (node.childNodes)
        node.childNodes.forEach((childNode, index) => {
            offsetCacheMap[(node as HTMLElement).id + '$' + index] = childNode;
            addNodeToOffsetCacheMap(childNode);
        });
}
export function resetOffsetCacheMap(editableElement: HTMLElement): void {
    offsetCacheMap = {};
    addNodeToOffsetCacheMap(editableElement);
}
export function getNodeFromOffsetCacheMap(parentId: string, index: number): Node {
    return offsetCacheMap[parentId + '$' + index];
}
export async function triggerEvents(eventStackList: TestEvent[][]): Promise<Node[]> {
    const addedNodes: Node[] = [];
    const editableElement = document.getElementById('editable');
    const nodeIndexContainer = new NodeIndexContainer(editableElement);
    for (const eventStack of eventStackList) {
        resetOffsetCacheMap(editableElement);
        eventStack.forEach((testEvent): void => {
            if (testEvent.type === 'mutation') {
                const mutationEvent: TestMutationEvent = testEvent;
                let mutatedNode: Node;
                if ((mutationEvent as TestMutationEventToDelete).targetParentId) {
                    mutatedNode = getNodeFromOffsetCacheMap(
                        (mutationEvent as TestMutationEventToDelete).targetParentId,
                        (mutationEvent as TestMutationEventToDelete).targetIndex,
                    );
                } else {
                    const targetId = (mutationEvent as TestMutationEventNormal).targetId;
                    mutatedNode = nodeIndexContainer.getNode(targetId);
                }
                // todo: remove theses instruction to infer the mutationType when rerecording the
                //       tests.
                if (!mutationEvent.mutationType) {
                    if (mutationEvent.addedNodes || mutationEvent.removedNodes) {
                        mutationEvent.mutationType = 'childList';
                    } else {
                        mutationEvent.mutationType = 'characterData';
                    }
                }
                if (testEvent.mutationType === 'childList') {
                    if (testEvent.removedNodes) {
                        testEvent.removedNodes
                            .map(removedNodeDescription => {
                                if (
                                    (removedNodeDescription as RemovedNodesTargetMutationId)
                                        .mutationSpecType
                                ) {
                                    return nodeIndexContainer.getNode(
                                        (removedNodeDescription as RemovedNodesTargetMutationId)
                                            .nodeId,
                                    );
                                    // todo: remove all "else", it was introduced to stay retrocompatible
                                } else if (
                                    (removedNodeDescription as RemovedNodesTargetMutationOnlyID).id
                                ) {
                                    return document.getElementById(
                                        (removedNodeDescription as RemovedNodesTargetMutationOnlyID)
                                            .id,
                                    );
                                } else if (
                                    typeof (removedNodeDescription as RemovedNodesTargetMutationIndex)
                                        .index === 'number'
                                ) {
                                    return getNodeFromOffsetCacheMap(
                                        (removedNodeDescription as RemovedNodesTargetMutationIndex)
                                            .parentId,
                                        (removedNodeDescription as RemovedNodesTargetMutationIndex)
                                            .index,
                                    );
                                } else {
                                    const description = removedNodeDescription as RemovedNodesTargetMutationPreviousSibling;
                                    const previousSibling = getNodeFromOffsetCacheMap(
                                        description.parentId,
                                        description.previousSiblingIndex,
                                    );
                                    const childNodes = Array.from(
                                        previousSibling.parentNode.childNodes,
                                    );
                                    return childNodes[description.previousSiblingIndex + 1];
                                }
                            })
                            .forEach(removedNode => {
                                removedNode.parentNode.removeChild(removedNode);
                            });
                    } else if (testEvent.addedNodes) {
                        testEvent.addedNodes.forEach(addedNodeDescription => {
                            let addedNode: Node;
                            if ((addedNodeDescription as AddedNodesTargetMutationId).nodeId) {
                                addedNode = nodeIndexContainer.getNode(
                                    (addedNodeDescription as AddedNodesTargetMutationId).nodeId,
                                );
                            } else if (addedNodeDescription.nodeType === Node.ELEMENT_NODE) {
                                const div = document.createElement('div');
                                div.innerHTML = addedNodeDescription.nodeValue;
                                addedNode = div.firstChild;
                                addedNodes.push(addedNode);

                                // if a node is an element and is added, we need to cache it in the
                                // offsetmap because other mutation event might reference this added
                                // node in the same stack.
                            } else if (addedNodeDescription.nodeType === Node.TEXT_NODE) {
                                addedNode = document.createTextNode(addedNodeDescription.nodeValue);
                                addedNodes.push(addedNode);
                            } else {
                                throw new Error('Unknown node type');
                            }
                            nodeIndexContainer.addIdToAllNodes(addedNode);

                            if (
                                (addedNodeDescription as AddedNodesTargetMutationId)
                                    .mutationSpecType
                            ) {
                                const addedNodeDescriptionId = addedNodeDescription as AddedNodesTargetMutationId;
                                if (addedNodeDescriptionId.previousSiblingId) {
                                    const previousSibling = nodeIndexContainer.getNode(
                                        addedNodeDescriptionId.previousSiblingId,
                                    );
                                    (previousSibling as ChildNode).after(addedNode);
                                } else if (addedNodeDescriptionId.nextSiblingId) {
                                    const nextSibling = nodeIndexContainer.getNode(
                                        addedNodeDescriptionId.nextSiblingId,
                                    );
                                    (nextSibling as ChildNode).before(addedNode);
                                } else {
                                    const parentNode = nodeIndexContainer.getNode(
                                        addedNodeDescriptionId.parentId,
                                    );
                                    parentNode.appendChild(addedNode);
                                }
                            } else if (
                                typeof (addedNodeDescription as AddedNodesTargetMutationPreviousSibling)
                                    .previousSiblingIndex === 'number'
                            ) {
                                const previousSibling = getNodeFromOffsetCacheMap(
                                    (addedNodeDescription as AddedNodesTargetMutationPreviousSibling)
                                        .parentId,
                                    (addedNodeDescription as AddedNodesTargetMutationPreviousSibling)
                                        .previousSiblingIndex,
                                );
                                (previousSibling as ChildNode).after(addedNode);
                            } else if (
                                typeof (addedNodeDescription as AddedNodesTargetMutationNextSibling)
                                    .nextSiblingIndex === 'number'
                            ) {
                                const netxSibling = getNodeFromOffsetCacheMap(
                                    (addedNodeDescription as AddedNodesTargetMutationPreviousSibling)
                                        .parentId,
                                    (addedNodeDescription as AddedNodesTargetMutationNextSibling)
                                        .nextSiblingIndex,
                                );
                                (netxSibling as ChildNode).before(addedNode);
                            } else if (
                                typeof (addedNodeDescription as AddedNodesTargetMutationNextSibling)
                                    .parentId === 'number'
                            ) {
                                const parentNode = document.getElementById(
                                    (addedNodeDescription as AddedNodesTargetMutationPreviousSibling)
                                        .parentId,
                                );
                                parentNode.appendChild(addedNode);
                            }
                            addNodeToOffsetCacheMap(addedNode.parentNode);
                        });
                    }
                } else if (mutationEvent.mutationType === 'characterData') {
                    mutatedNode.textContent = mutationEvent.textContent;
                }
            } else if (testEvent.type === 'selection') {
                if ((testEvent as TestSelectionEventNew).anchor.targetSelectionId) {
                    const selectionEvent = testEvent as TestSelectionEventNew;
                    // const focusElement = document.getElementById(selectionEvent.focus.id);
                    // const anchorElement = document.getElementById(selectionEvent.anchor.id);
                    setRange(
                        nodeIndexContainer.getNode(selectionEvent.anchor.targetSelectionId),
                        selectionEvent.anchor.offset,
                        nodeIndexContainer.getNode(selectionEvent.focus.targetSelectionId),
                        selectionEvent.focus.offset,
                    );
                } else {
                    const selectionEvent = testEvent as TestSelectionEventOld;

                    const focusElement = document.getElementById(selectionEvent.focus.id);
                    const anchorElement = document.getElementById(selectionEvent.anchor.id);
                    setRange(
                        anchorElement.childNodes[selectionEvent.anchor.index],
                        selectionEvent.anchor.offset,
                        focusElement.childNodes[selectionEvent.focus.index],
                        selectionEvent.focus.offset,
                    );
                }
            } else {
                const { type, ...options } = testEvent;
                triggerEvent(editableElement, type, options as TriggerNativeEventsOption);
            }
        });
        await nextTick();
        await nextTick();
    }
    await nextTick();
    // todo: check if we still need to return this variable
    return addedNodes;
}

function cleanDuplicateIds(editable: Element): void {
    const alreadyPresentIds = new Set();
    editable.querySelectorAll('*').forEach(element => {
        if (alreadyPresentIds.has(element.id)) {
            element.id = '';
        } else {
            alreadyPresentIds.add(element.id);
        }
    });
}
/**
 * In order to target the elements in the function `triggerEvents`, we associate an ID to each
 * elements that does not have ID inside the editable element.
 */
let lastElementId = 0;
export function addIdToRemainingElements(editable: Element): void {
    cleanDuplicateIds(editable);
    // debugger
    const nodesWithoutId = [...editable.querySelectorAll('*')].filter(node => node.id === '');
    nodesWithoutId.forEach(node => {
        node.id = 'element-' + lastElementId;
        lastElementId++;
    });
}
export function resetElementsIds(editable: Element): void {
    lastElementId = 0;
    addIdToRemainingElements(editable);
}

export interface TestContext {
    container: HTMLElement;
    editable: HTMLElement;
    other: HTMLElement;
    eventBatches: EventBatch[];
    normalizer: EventNormalizer;
}

export function testCallbackBefore(): TestContext {
    // ? what is the purpose of the container and the root?
    const container = document.createElement('container');
    container.style.fontFamily = 'Courier, Courier New';
    container.style.lineHeight = '20px';
    container.style.fontSize = '18px';
    container.style.display = 'block';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    const editable = document.createElement('div');
    editable.id = 'editable';
    editable.style.display = 'block';
    container.appendChild(editable);
    // ? why do we create other?
    const other = document.createElement('div');
    other.innerText = 'abc';
    container.appendChild(other);
    document.body.appendChild(container);
    const eventBatchs = [];
    const normalizer = new EventNormalizer(editable, (res: EventBatch): void => {
        eventBatchs.push(res);
    });
    return {
        container: container,
        editable: editable,
        other: other,
        eventBatches: eventBatchs,
        normalizer: normalizer,
    };
}
export function testCallbackAfter(testContext: TestContext): void {
    document.body.removeChild(testContext.container);
    testContext.normalizer.destroy();
}
