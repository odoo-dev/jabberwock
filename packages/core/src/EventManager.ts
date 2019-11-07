import { EventNormalizer, DomRangeDescription } from './EventNormalizer';
import { LineBreakNode } from './VNodes/LineBreakNode';
import JWEditor from './JWEditor';
import { CommandConfig, KeyMapping } from './KeyMapping';

interface SetRangeParams {
    domRange: DomRangeDescription;
}

interface EventManagerOptions {
    keyMap?: KeyMapping;
}

export class EventManager {
    editor: JWEditor;
    eventNormalizer: EventNormalizer;
    keyMap: KeyMapping;

    constructor(editor: JWEditor, options: EventManagerOptions = {}) {
        this.editor = editor;
        this.eventNormalizer = new EventNormalizer(
            editor.editable,
            this._onNormalizedEvent.bind(this),
        );
        this.keyMap = options.keyMap;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Callback given to the normalizer.
     */
    _onNormalizedEvent(customEvent: CustomEvent): void {
        const payload = customEvent.detail;
        let shortcutMatch: CommandConfig;
        switch (customEvent.type) {
            case 'enter':
                if (customEvent.detail.shiftKey) {
                    return this.editor.execCommand('insert', { value: new LineBreakNode() });
                } else {
                    return this.editor.execCommand('insertParagraphBreak');
                }
            case 'selectAll':
            case 'setRange': {
                const rangeParams = payload as SetRangeParams;
                return this.editor.execCommand(customEvent.type, {
                    vRange: this.editor.parser.parseRange(rangeParams.domRange),
                });
            }
            case 'keydown': {
                // TODO: keydown should be matched with existing shortcuts. If
                // it matches an command shortcut, trigger the corresponding
                // command, otherwise do not trigger any command.

                // TODO: use payload.code (Digit[0-6]) instead of
                // payload.key
                if (this.keyMap) {
                    shortcutMatch = this.keyMap.fromKeypress(payload);
                    if (shortcutMatch) {
                        this.editor.execCommand(shortcutMatch.name, shortcutMatch.arguments);
                    }
                }
                return;
            }
            default:
                this.editor.execCommand(customEvent.type, payload);
        }
    }
}
