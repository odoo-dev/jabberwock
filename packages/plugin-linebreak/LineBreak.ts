import { JWPlugin } from '../core/src/JWPlugin';
import { LineBreakNode } from './LineBreakNode';
import { LineBreakDomParser } from './LineBreakDomParser';
import { LineBreakDomRenderer } from './LineBreakDomRenderer';

export class LineBreak extends JWPlugin {
    readonly parsers = [LineBreakDomParser];
    renderers = [LineBreakDomRenderer];
    commands = {
        insertLineBreak: {
            handler: this.insertLineBreak.bind(this),
        },
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a line break node at range.
     */
    insertLineBreak(): void {
        this.editor.vDocument.insert(new LineBreakNode());
    }
}
