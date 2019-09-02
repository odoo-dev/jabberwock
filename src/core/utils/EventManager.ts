import { EventNormalizer } from './EventNormalizer';

export class EventManager {
    editable: DOMElement
    eventNormalizer: EventNormalizer;

    constructor (editable: HTMLElement, options: EventNormalizerOptions) {
        this.editable = <DOMElement>editable;
        this.options = options;
        this.eventNormalizer = new EventNormalizer(editable, this._triggerEvent.bind(this));
    }
    /**
     * todo: Trigger the action.
     */
    _triggerEvent (type: string, param: any = null) {
        console.log(type, param);
    }
};
