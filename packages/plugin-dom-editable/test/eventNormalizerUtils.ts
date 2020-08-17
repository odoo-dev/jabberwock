import { EventBatch, EventNormalizer } from '../src/EventNormalizer';
import { nodeName } from '../../utils/src/utils';

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
    // `id` of the node attributed by a `NodeIndexGenerator`.
    nodeId?: number;
    // When a node is added from a mutation that was not in the DOM, the two
    // following key `nodeValue` contain the created node value
    nodeValue?: string;
    // When a node is added from a mutation that was not in the DOM, the two
    // following key `nodeType` contain the created node value
    nodeType?: number;
    // If present in the mutation, the following `id` is attributed by a
    // `NodeIndexGenerator`
    previousSiblingId?: number;
    // If present in the mutation, the following `id` is attributed by a
    // `NodeIndexGenerator`
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
        // The `id` of the focus node provided by `NodeIndexGenerator`.
        nodeId: number;
        offset: number;
    };
    anchor: {
        // The `id` of the anchor node provided by `NodeIndexGenerator`.
        nodeId: number;
        offset: number;
    };
}

export type TestEvent =
    | TestKeyboardEvent
    | TestCompositionEvent
    | TestInputEvent
    | TestMutationEvent
    | TestSelectionEvent;

/**
 * The class exists because the original `InputEvent` does not allow to override
 * its inputType property.
 */
class SimulatedInputEvent extends InputEvent {
    eventInitDict: InputEventInit;
    constructor(type: string, eventInitDict?: InputEventInit) {
        super(type, eventInitDict);
        this.eventInitDict = eventInitDict;
    }
    get inputType(): string {
        return this.eventInitDict.inputType;
    }
}

const eventTypes: Record<string, new (name: string, options: object) => Event> = {
    'pointer': MouseEvent,
    'contextmenu': MouseEvent,
    'select': MouseEvent,
    'wheel': MouseEvent,
    'click': MouseEvent,
    'dblclick': MouseEvent,
    'mousedown': MouseEvent,
    'mouseenter': MouseEvent,
    'mouseleave': MouseEvent,
    'mousemove': MouseEvent,
    'mouseout': MouseEvent,
    'mouseover': MouseEvent,
    'mouseup': MouseEvent,
    'compositionstart': CompositionEvent,
    'compositionend': CompositionEvent,
    'compositionupdate': CompositionEvent,
    'input': SimulatedInputEvent,
    'beforeinput': SimulatedInputEvent,
    'keydown': KeyboardEvent,
    'keypress': KeyboardEvent,
    'keyup': KeyboardEvent,
    'dragstart': DragEvent,
    'dragend': DragEvent,
    'drop': DragEvent,
    'beforecut': ClipboardEvent,
    'cut': ClipboardEvent,
    'paste': ClipboardEvent,
    'touchstart': TouchEvent,
    'touchend': TouchEvent,
};

/**
 * Trigger events natively on the specified target.
 *
 * @param {node} el
 * @param {string} eventName
 * @param {object} [options]
 * @returns {Promise <Event>}
 */
export function triggerEvent(
    el: Node | Element,
    eventName: string,
    options: TriggerNativeEventsOption,
): Event {
    if (!el) {
        console.warn('Impossible to trigger an event on an undefined node.');
        return;
    }
    const currentElement = el instanceof Element ? el : el.parentNode;
    if (!currentElement.parentNode) {
        console.warn('Impossible to trigger an event on a node out of the DOM.');
        return;
    }
    options = Object.assign(
        {
            view: window,
            bubbles: true,
            composed: true,
            cancelable: true,
        },
        options,
    );
    const EventClass = eventTypes[eventName] || Event;
    if (EventClass === ClipboardEvent && !('clipboardData' in options)) {
        throw new Error('Wrong test');
    }
    const ev = new EventClass(eventName, options);

    currentElement.dispatchEvent(ev);
    return ev;
}
export function setSelection(
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

/**
 * The following class is used for recording javascript events (for the tool
 * `getKeys`) and for simulating them (in the current file).
 *
 * It's purpose is to have a unique `id` of a `Node` between the time we record
 * an event and the time we simulate it.
 *
 * This is achieved by recursively generate a new `id` to all DOM nodes before
 * and when recording events (i.e. when new node are added) as well as before
 * and when simulating events.
 *
 * Before and when simulating event we run the same logic.
 *
 * When recording, to retrieve the `id` of a `Node`, use the method `getId`.
 *
 * When simulating, to retrieve the `Node` associated to `id`, use the method
 * `getNode`.
 */
export class NodeIndexGenerator {
    /**
     * The last `id` generated.
     */
    lastNodeId = 0;
    readonly nodeIdMap: Map<Node, number> = new Map<Node, number>();
    readonly idNodeMap: Map<number, Node> = new Map<number, Node>();

    constructor(public readonly containerElement: Element) {
        this.getnerateIds(this.containerElement);
    }

    /**
     * Generate ids recursively on `node`.
     *
     * @param node
     */
    getnerateIds(node: Node): void {
        if (!this.nodeIdMap.get(node)) {
            const newId = this.lastNodeId++;
            this.nodeIdMap.set(node, newId);
            this.idNodeMap.set(newId, node);
        }
        for (const childNode of node.childNodes) {
            this.getnerateIds(childNode);
        }
    }
    getId(node: Node): number {
        return this.nodeIdMap.get(node);
    }
    getNode(id: number): Node {
        return this.idNodeMap.get(id);
    }
}

/**
 * Search in dom (including shadow element) the contenteditable=true.
 */
function getEditableElement(): Element {
    let editableElement = document.querySelector('[contentEditable=true]');
    if (!editableElement) {
        const els = [...document.querySelectorAll('jw-shadow, iframe')];
        while (!editableElement && els.length) {
            const el = els.pop();
            if (el instanceof HTMLIFrameElement) {
                els.push(
                    ...el.contentWindow.document.querySelectorAll('jw-shadow, jw-iframe, iframe'),
                );
            } else if (el.shadowRoot) {
                editableElement = el.shadowRoot.querySelector('[contentEditable=true]');
            }
        }
    }
    return editableElement;
}
/**
 * Trigger events for of a list of stacks that where previously recorded with
 * the tool `getKeys`.
 *
 * @param eventStackList All the stack that have been recorded.
 */
export async function triggerEvents(eventStackList: TestEvent[][]): Promise<void> {
    const addedNodes: Node[] = [];
    const nodeIndexGenerator = new NodeIndexGenerator(getEditableElement());
    for (const eventStack of eventStackList) {
        let keyEventPrevented = false;
        for (const testEvent of eventStack) {
            if (testEvent.type === 'mutation') {
                const mutationEvent = testEvent;
                const targetId = mutationEvent.targetId;
                const mutatedNode = nodeIndexGenerator.getNode(targetId);
                if (testEvent.mutationType === 'childList') {
                    if (testEvent.removedNodes) {
                        testEvent.removedNodes
                            .map(removedNodeDescription => {
                                return nodeIndexGenerator.getNode(removedNodeDescription.nodeId);
                            })
                            .forEach(removedNode => {
                                removedNode.parentNode.removeChild(removedNode);
                            });
                    } else if (testEvent.addedNodes) {
                        testEvent.addedNodes.forEach(addedNodeDescription => {
                            let addedNode: Node;
                            if (addedNodeDescription.nodeId) {
                                addedNode = nodeIndexGenerator.getNode(addedNodeDescription.nodeId);
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
                            // If a new DOM `Node` has been generated, add it to
                            // be added to the nodeIndexGenerator maps.
                            nodeIndexGenerator.getnerateIds(addedNode);

                            if (addedNodeDescription.previousSiblingId) {
                                const previousSibling = nodeIndexGenerator.getNode(
                                    addedNodeDescription.previousSiblingId,
                                );
                                (previousSibling as ChildNode).after(addedNode);
                            } else if (addedNodeDescription.nextSiblingId) {
                                const nextSibling = nodeIndexGenerator.getNode(
                                    addedNodeDescription.nextSiblingId,
                                );
                                (nextSibling as ChildNode).before(addedNode);
                            } else {
                                const parentNode = nodeIndexGenerator.getNode(
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
                if (testEvent.anchor.nodeId) {
                    const selectionEvent = testEvent;
                    setSelection(
                        nodeIndexGenerator.getNode(selectionEvent.anchor.nodeId),
                        selectionEvent.anchor.offset,
                        nodeIndexGenerator.getNode(selectionEvent.focus.nodeId),
                        selectionEvent.focus.offset,
                    );
                }
            } else {
                const { type, ...options } = testEvent;
                if (!(keyEventPrevented && ['keydown', 'keypress', 'keyup'].includes(type))) {
                    const event = triggerEvent(
                        getEditableElement(),
                        type,
                        options as TriggerNativeEventsOption,
                    );
                    keyEventPrevented = event.defaultPrevented;
                }
            }
        }
        await nextTick();
        // The normalizer in some cases need two ticks to aggregate all
        // informations (e.g. Safari).
        await nextTick();
    }
}

export interface TestContext {
    container: HTMLElement;
    editable: HTMLElement;
    divOutsideEditable: HTMLElement;
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
    editable.setAttribute('contentEditable', 'true');
    editable.style.display = 'block';
    container.appendChild(editable);
    const div = document.createElement('div');
    div.innerText = 'abc';
    container.appendChild(div);
    document.body.appendChild(container);
    const eventBatchs = [];
    const normalizer = new EventNormalizer(
        (domNode: Node) => {
            return editable === domNode || editable.contains(domNode);
        },
        async function(batchPromise: Promise<EventBatch>): Promise<void> {
            const batch = await batchPromise;
            if (batch.actions.length > 0) {
                eventBatchs.push(await batch);
            }
        },
        {
            handle: (): void => {
                return;
            },
            handleCapture: (): void => {
                return;
            },
        },
    );
    return {
        container: container,
        editable: editable,
        divOutsideEditable: div,
        eventBatches: eventBatchs,
        normalizer: normalizer,
    };
}
export function testCallbackAfter(testContext: TestContext): void {
    document.body.removeChild(testContext.container);
    testContext.normalizer.destroy();
}
