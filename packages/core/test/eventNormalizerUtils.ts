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
    // Firefox does not provide data or inputType, which is why theses keys are
    // optionnal
    data?: string;
    inputType?: string;
    defaultPrevented?: boolean;
}

export interface RemovedNodesTargetMutation {
    nodeId: number;
}

export interface AddedNodesTargetMutation {
    parentId: number;
    // When a node is added and was already present in the DOM, we capture the
    // `id` of the node attributed by a `NodeIndexContainer`.
    nodeId?: number;
    // When a node is added from a mutation that was not in the DOM, the two
    // following key `nodeValue` contain the created node value
    nodeValue?: string;
    // When a node is added from a mutation that was not in the DOM, the two
    // following key `nodeType` contain the created node value
    nodeType?: number;
    // If present in the mutation, the following `id` is attributed by a
    // `NodeIndexContainer`
    previousSiblingId?: number;
    // If present in the mutation, the following `id` is attributed by a
    // `NodeIndexContainer`
    nextSiblingId?: number;
}
export interface TestMutationEvent {
    type: 'mutation';
    mutationType?: string;
    textContent?: string;
    targetId?: number;
    removedNodes?: RemovedNodesTargetMutation[];
    addedNodes?: AddedNodesTargetMutation[];
}

export interface TestSelectionEvent {
    type: 'selection';
    focus: {
        // The `id` of the focus node provided by `NodeIndexContainer`.
        targetSelectionId: number;
        offset: number;
    };
    anchor: {
        // The `id` of the anchor node provided by `NodeIndexContainer`.
        targetSelectionId: number;
        offset: number;
    };
}

export type TestEvent =
    | TestKeyboardEvent
    | TestCompositionEvent
    | TestInputEvent
    | TestMutationEvent
    | TestSelectionEvent;

const _eventTypes = {
    MouseEvent: [
        'pointer',
        'contextmenu',
        'select',
        'wheel',
        'click',
        'dblclick',
        'mousedown',
        'mouseenter',
        'mouseleave',
        'mousemove',
        'mouseout',
        'mouseover',
        'mouseup',
    ],
    CompositionEvent: ['compositionstart', 'compositionend', 'compositionupdate'],
    InputEvent: ['input', 'beforeinput'],
    KeyboardEvent: ['keydown', 'keypress', 'keyup'],
    DragEvent: ['dragstart', 'dragend', 'drop'],
    ClipboardEvent: ['beforecut', 'cut', 'paste'],
    TouchEvent: ['touchstart', 'touchend'],
};
const _eventTypeMap: Record<string, string> = {};
for (const type of Object.keys(_eventTypes)) {
    for (const name of _eventTypes[type]) {
        _eventTypeMap[name] = type;
    }
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
    const type = _eventTypeMap[eventName];
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
 * For each `eventStackList` in `triggerEvents()`, we need to retrieve
 * information of the `index` that is contained within a `parent` that has an
 * `id`.  It is possible that within the `eventStackList` loop, childs of a node
 * are removed. However, the index of a childNode within his parent is encoded
 * relative to the beggining of the stack when all nodes were still preset.
 *
 * For that reason we cannot retrieve a childNode with
 * `parent.childNodes[index]` but we must do `offsetCacheMap[parentId + '$' +
 * index]`.
 *
 * Encode the key of the offsetCacheMap with "<parentId>$<childIndex>" (e.g. if
 * the parent id is 'a' and the offset is 0, the key will be encoded as "a$0").
 */
export async function triggerEvents(eventStackList: TestEvent[][]): Promise<void> {
    const addedNodes: Node[] = [];
    const editableElement = document.getElementById('editable');
    const nodeIndexContainer = new NodeIndexContainer(editableElement);
    for (const eventStack of eventStackList) {
        eventStack.forEach((testEvent): void => {
            if (testEvent.type === 'mutation') {
                const mutationEvent = testEvent;
                const targetId = mutationEvent.targetId;
                const mutatedNode = nodeIndexContainer.getNode(targetId);
                if (testEvent.mutationType === 'childList') {
                    if (testEvent.removedNodes) {
                        testEvent.removedNodes
                            .map(removedNodeDescription => {
                                return nodeIndexContainer.getNode(removedNodeDescription.nodeId);
                            })
                            .forEach(removedNode => {
                                removedNode.parentNode.removeChild(removedNode);
                            });
                    } else if (testEvent.addedNodes) {
                        testEvent.addedNodes.forEach(addedNodeDescription => {
                            let addedNode: Node;
                            if (addedNodeDescription.nodeId) {
                                addedNode = nodeIndexContainer.getNode(addedNodeDescription.nodeId);
                            } else if (addedNodeDescription.nodeType === Node.ELEMENT_NODE) {
                                const div = document.createElement('div');
                                div.innerHTML = addedNodeDescription.nodeValue;
                                addedNode = div.firstChild;
                                addedNodes.push(addedNode);
                            } else if (addedNodeDescription.nodeType === Node.TEXT_NODE) {
                                addedNode = document.createTextNode(addedNodeDescription.nodeValue);
                                addedNodes.push(addedNode);
                            } else {
                                throw new Error('Unknown node type');
                            }
                            nodeIndexContainer.addIdToAllNodes(addedNode);

                            if (addedNodeDescription.previousSiblingId) {
                                const previousSibling = nodeIndexContainer.getNode(
                                    addedNodeDescription.previousSiblingId,
                                );
                                (previousSibling as ChildNode).after(addedNode);
                            } else if (addedNodeDescription.nextSiblingId) {
                                const nextSibling = nodeIndexContainer.getNode(
                                    addedNodeDescription.nextSiblingId,
                                );
                                (nextSibling as ChildNode).before(addedNode);
                            } else {
                                const parentNode = nodeIndexContainer.getNode(
                                    addedNodeDescription.parentId,
                                );
                                parentNode.appendChild(addedNode);
                            }
                        });
                    }
                } else if (mutationEvent.mutationType === 'characterData') {
                    mutatedNode.textContent = mutationEvent.textContent;
                }
            } else if (testEvent.type === 'selection') {
                if (testEvent.anchor.targetSelectionId) {
                    const selectionEvent = testEvent;
                    setRange(
                        nodeIndexContainer.getNode(selectionEvent.anchor.targetSelectionId),
                        selectionEvent.anchor.offset,
                        nodeIndexContainer.getNode(selectionEvent.focus.targetSelectionId),
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
}

export interface TestContext {
    container: HTMLElement;
    editable: HTMLElement;
    div: HTMLElement;
    eventBatches: EventBatch[];
    normalizer: EventNormalizer;
}

export function testCallbackBefore(): TestContext {
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
    const div = document.createElement('div');
    div.innerText = 'abc';
    container.appendChild(div);
    document.body.appendChild(container);
    const eventBatchs = [];
    const normalizer = new EventNormalizer(editable, (res: EventBatch): void => {
        eventBatchs.push(res);
    });
    return {
        container: container,
        editable: editable,
        div: div,
        eventBatches: eventBatchs,
        normalizer: normalizer,
    };
}
export function testCallbackAfter(testContext: TestContext): void {
    document.body.removeChild(testContext.container);
    testContext.normalizer.destroy();
}
