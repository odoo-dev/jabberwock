import { JWPlugin } from '../JWPlugin';
import { VRangeStore } from '../stores/VRange';
import { VDocument } from '../stores/VDocument';
import { Range } from './EventNormalizer';

export class CorePlugin extends JWPlugin {
    range = new VRangeStore();
    vDocument: VDocument;
    handlers = {
        intents: {
            remove: 'onRemoveIntent', // names are just to show relationships here
            setRange: 'onSetRange',
        },
        preCommands: {},
        postCommands: {
            navigate: 'setRange',
        },
    };
    commands = {
        onRemoveIntent: this.removeSide,
        onSetRange: this.onSetRange.bind(this),
        setRange: this.setRange.bind(this),
    };
    constructor(dispatcher, vDocument) {
        super(dispatcher);
        this.vDocument = vDocument;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Take a 'setRange' intent and trigger the corresponding 'navigate'
     * primitive action, with `VNodes` instead of DOM nodes.
     *
     * @param {Intent} intent
     * @returns {Command}
     */
    onSetRange(intent: Intent): void {
        const intentRange = intent.payload['range'];
        const range: VRange = this._findFromDOM(intentRange);
        range.endContainer = range.endContainer || range.startContainer;
        range.endOffset = range.endOffset || range.startOffset;
        range.direction = range.direction || 'forward';
        this.range.set(range);
        console.log('NEW RANGE:', this.range.get());
    }
    removeSide(intent: Action): void {
        console.log('REMOVE SIDE:' + intent);
    }
    /**
     * Set a new VRange, based on a 'navigate' primitive action.
     *
     * @param {Action} action
     */
    setRange(action: Action): void {
        const actionRange = action.payload['range'];
        // Induce the missing values if necessary
        const range: VRange = {
            startContainer: actionRange.startContainer,
            startOffset: actionRange.startOffset,
            endContainer: actionRange.endContainer || actionRange.startContainer,
            endOffset: actionRange.endOffset || actionRange.startOffset,
            direction: actionRange.direction || 'forward',
        };
        this.range.set(range);
        console.log('NEW RANGE:', this.range.get());
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Take a `Range` and return its equivalent `VRange` by matching its nodes
     * with its corresponding `VNodes`.
     *
     * @param {Range} range
     * @returns {VRange}
     */
    _findFromDOM(range: Range): VRange {
        const vRange = {};
        Object.keys(range).forEach((key: string) => {
            if (key === 'startContainer' || key === 'endContainer') {
                vRange[key] = this.vDocument.find(range[key]);
            } else {
                vRange[key] = range[key];
            }
        });
        return vRange as VRange;
    }
}
