import { OwlComponent } from '../../../plugin-owl/src/OwlComponent';
import { LinkParams } from '../Link';
import { Layout } from '../../../plugin-layout/src/Layout';
import { useState } from '@odoo/owl';

interface LinkProps {
    url?: string;
    label?: string;
}

export class LinkComponent<T extends LinkProps = {}> extends OwlComponent<T> {
    static components = {};
    static template = 'link';
    state = useState({
        url: this.props?.url || '',
        label: this.props?.label || '',
    });

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    async saveLink(): Promise<void> {
        await this.env.editor.execCommand('link', {
            url: this.state.url,
            label: this.state.label,
        } as LinkParams);
        this.env.editor.plugins.get(Layout).remove('link');
        this.destroy();
    }
    cancel(): void {
        this.env.editor.plugins.get(Layout).remove('link');
        this.destroy();
    }
}
