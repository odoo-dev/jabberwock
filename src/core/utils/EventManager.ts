import { DOMElement } from '../types/DOMElement.js';
import { EventNormalizer } from './EventNormalizer.js';
import { ActionType } from '../actions/Action';

export interface EventManagerOptions {
    dispatch: Function;
}

export class EventManager {
    editor: DOMElement;
    editable: DOMElement;
    options: EventManagerOptions;
    eventNormalizer: EventNormalizer;

    constructor(editor: HTMLElement, editable: HTMLElement, options: EventManagerOptions) {
        this.editor = <DOMElement>editor;
        this.editable = <DOMElement>editable;
        this.options = options;
        this.eventNormalizer = new EventNormalizer(editable, this._triggerEvent.bind(this));
    }

    /**
     * todo: Trigger the action.
     */
    _triggerEvent(type: string, param: any = null): void {
        if (this.options.dispatch) {
            if (type === 'insert') {
                this.options.dispatch({ type: ActionType.INSERT, param: param });
            } else {
                this.options.dispatch({ type: type, param: param });
            }
        }
    }
}
