import { JWPlugin } from '../JWPlugin';
import { VDocument } from '../stores/VDocument';

export class CorePlugin extends JWPlugin {
    vDocument: VDocument;
    handlers = {
        intents: {
            remove: 'onRemoveIntent', // names are just to show relationships here
        },
    };
    commands = {
        onRemoveIntent: this.removeSide,
    };
    constructor(dispatcher, vDocument) {
        super(dispatcher);
        this.vDocument = vDocument;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    removeSide(intent: Action): void {
        console.log('REMOVE SIDE:' + intent);
    }
}
