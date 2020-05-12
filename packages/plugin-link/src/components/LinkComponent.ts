import { OwlComponent } from '../../../plugin-owl/src/ui/OwlComponent';
import { InlineNode } from '../../../plugin-inline/src/InlineNode';
import { LinkFormat } from '../LinkFormat';
import { LinkParams } from '../Link';
import { Layout } from '../../../plugin-layout/src/Layout';
import { useState } from '@odoo/owl';

export class LinkComponent<T = {}> extends OwlComponent<T> {
    static components = {};
    static template = 'link';
    state = useState({
        url: this._getCurrentUrl(),
        label: this._getCurrentLabel(),
    });

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    async saveLink(): Promise<void> {
        await this.env.editor.execCommand('link', {
            url: this.state.url,
            label: this.state.label,
        } as LinkParams);
        this.destroy();
    }
    cancel(): void {
        this.env.editor.plugins.get(Layout).remove('link');
        this.destroy();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _getCurrentUrl(): string {
        const range = this.env.editor.selection.range;
        const selectedInlines = range.selectedNodes(InlineNode);
        const firstLink = selectedInlines.find(node => node.modifiers.find(LinkFormat));
        const link = firstLink && firstLink.modifiers.find(LinkFormat).clone();
        return (link && link.url) || '';
    }
    _getCurrentLabel(): string {
        const range = this.env.editor.selection.range;
        const selectedInlines = range.selectedNodes(InlineNode);
        return selectedInlines.map(node => node.textContent).join('');
    }
}
