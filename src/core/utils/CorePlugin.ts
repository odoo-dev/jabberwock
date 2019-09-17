import { JWPlugin } from '../JWPlugin';
import { VDocument } from '../stores/VDocument';
import { VNode } from '../stores/VNode';
import { Action } from '../types/Flux';

export class CorePlugin extends JWPlugin {
    vDocument: VDocument;
    _root: VNode;
    intents = {
        remove: 'onRemoveIntent', // names are just to show relationships here
    };
    commands = {
        onRemoveIntent: this.removeSide,
    };
    actions = {
    };
    constructor(dispatcher, vDocument) {
        super(dispatcher);
        this.vDocument = vDocument;
        this._root = this.vDocument._root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    removeSide(intent: Action): void {
        console.log('REMOVE SIDE:' + intent);
    }
}
