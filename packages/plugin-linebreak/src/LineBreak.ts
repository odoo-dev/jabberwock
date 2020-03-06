import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { LineBreakNode } from './LineBreakNode';
import { LineBreakDomParser } from './LineBreakDomParser';
import { LineBreakDomRenderer } from './LineBreakDomRenderer';
import { InsertParams } from '../../core/src/CorePlugin';

export class LineBreak<T extends JWPluginConfig> extends JWPlugin<T> {
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
        const params: InsertParams = {
            node: new LineBreakNode(),
        };
        this.editor.execCommand('insert', params);
    }
}
