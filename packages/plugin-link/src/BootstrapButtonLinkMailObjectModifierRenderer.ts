import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';
import { MailObjectRenderingEngine } from '../../plugin-mail/src/MailObjectRenderingEngine';
import {
    DomObject,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Modifier } from '../../core/src/Modifier';
import { VNode } from '../../core/src/VNodes/VNode';
import { LinkFormat } from './LinkFormat';
import { MailRenderingEngineWorker } from '../../plugin-mail/src/MailRenderingEngineCache';

export class BootstrapButtonLinkMailObjectModifierRenderer extends ModifierRenderer<DomObject> {
    static id = MailObjectRenderingEngine.id;
    engine: MailObjectRenderingEngine;
    predicate = (modifier: Modifier): boolean => {
        if (!(modifier instanceof LinkFormat)) {
            return false;
        }
        const classList = modifier.modifiers.find(Attributes).classList;
        return classList.has('btn') && !classList.has('btn-link');
    };

    /**
     * Rendering for Outlook mail client of link with bootstrap btn format.
     * (use table to keep button background color, margin, padding and border-radius)
     *
     * @param modifier
     * @param renderings
     * @param batch
     */
    async render(
        modifier: LinkFormat,
        renderings: DomObject[],
        batch: VNode[],
        worker: MailRenderingEngineWorker,
    ): Promise<DomObject[]> {
        const [linkObject] = (await this.super.render(
            modifier,
            renderings,
            batch,
            worker,
        )) as DomObjectElement[];
        const styleFromRules = await worker.getStyleFromCSSRules(batch[0], linkObject);
        linkObject.attributes.style = styleFromRules.current;

        const table: DomObject = {
            tag: 'TABLE',
            attributes: {
                style: {
                    'display': 'inline-table',
                    'vertical-align': 'middle',
                },
                cellpadding: '0',
                cellspacing: '0',
            },
            children: [
                {
                    tag: 'TBODY',
                    children: [
                        {
                            tag: 'TR',
                            children: [
                                {
                                    tag: 'TD',
                                    attributes: {
                                        style: {
                                            'text-align':
                                                styleFromRules.current['text-align'] ||
                                                styleFromRules.inherit['text-align'] ||
                                                'left',
                                            'margin':
                                                styleFromRules.current.padding ||
                                                styleFromRules.inherit.padding ||
                                                '0px',
                                            'border-radius':
                                                styleFromRules.current['border-radius'] ||
                                                styleFromRules.inherit['border-radius'] ||
                                                'left',
                                            'background-color':
                                                styleFromRules.current['background-color'] ||
                                                styleFromRules.inherit['background-color'] ||
                                                'transparent',
                                        },
                                    },
                                    children: [linkObject],
                                },
                            ],
                        },
                    ],
                },
            ],
        };

        return [table];
    }
}
