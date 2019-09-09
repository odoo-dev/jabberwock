import { DOMElement } from '../types/DOMElement';
import { EventNormalizer } from './EventNormalizer';

export interface EventManagerOptions {
    dispatch: Function;
}

export class EventManager {
    editor: DOMElement;
    editable: DOMElement;
    options: EventManagerOptions;
    eventNormalizer: EventNormalizer;

    constructor(editor: HTMLElement, editable: HTMLElement, options: EventManagerOptions) {
        this.editor = editor as DOMElement;
        this.editable = editable as DOMElement;
        this.options = options;
        this.eventNormalizer = new EventNormalizer(editable, this._triggerEvent.bind(this));
    }
    /**
     * todo: Trigger the action.
     */
    _triggerEvent(type: string, param: object = {}): void {
        console.log(type, param);
    }
}
