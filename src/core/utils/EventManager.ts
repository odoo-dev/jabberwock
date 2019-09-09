import { DOMElement } from '../types/DOMElement';
import { EventNormalizer } from './EventNormalizer';

export interface EventManagerOptions {
    dispatch?: Function;
}

export class EventManager {
    editable: DOMElement;
    options: EventManagerOptions;
    eventNormalizer: EventNormalizer;

    constructor(editable: HTMLElement, options: EventManagerOptions = {}) {
        this.editable = editable as DOMElement;
        this.options = options;
        this.eventNormalizer = new EventNormalizer(editable, this._triggerEvent.bind(this));
    }
    /**
     * TODO: Actually generate the actions.
     */
    _triggerEvent(type: string, param: object = {}): void {
        console.log(type, param);
    }
}
