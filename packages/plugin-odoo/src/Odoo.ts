import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { LinkFormat } from '../../plugin-link/src/LinkFormat';
import { Attributes } from '../../plugin-xml/src/Attributes';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Layout } from '../../plugin-layout/src/Layout';
import { Inline } from '../../plugin-inline/src/Inline';
import { Link } from '../../plugin-link/src/Link';
import { Xml } from '../../plugin-xml/src/Xml';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { OdooStructureXmlDomParser } from './OdooStructureXmlDomParser';
import { OdooImageDomObjectRenderer } from './OdooImageDomObjectRenderer';
import { OdooFontAwesomeDomObjectRenderer } from './OdooFontAwesomeDomObjectRenderer';
import { OdooTranslationXmlDomParser } from './OdooTranslationXmlDomParser';
import { DividerNode } from '../../plugin-divider/src/DividerNode';

export class Odoo<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline, Link, Xml];
    readonly loadables: Loadables<Parser & Renderer & Layout> = {
        parsers: [OdooStructureXmlDomParser, OdooTranslationXmlDomParser],
        renderers: [OdooImageDomObjectRenderer, OdooFontAwesomeDomObjectRenderer],
        components: [
            {
                id: 'OdooLinkButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'link',
                        label: 'Insert link',
                        commandId: 'openLinkDialog',
                        selected: (editor: JWEditor): boolean => {
                            const range = editor.selection.range;
                            const node = range.start.nextSibling() || range.start.previousSibling();
                            return (
                                node &&
                                node instanceof InlineNode &&
                                !!node.modifiers.find(LinkFormat)
                            );
                        },
                        modifiers: [new Attributes({ class: 'fa fa-link fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'OdooMediaButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'media',
                        label: 'Media',
                        commandId: 'openMedia',
                        modifiers: [new Attributes({ class: 'fa fa-file-image-o fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'OdooTextColorButton',
                async render(): Promise<DividerNode[]> {
                    const button = new ActionableNode({
                        name: 'textcolorpicker',
                        label: 'Text Color picker',
                        commandId: 'openTextColorPicker',
                        modifiers: [
                            new Attributes({ class: 'fa fa-font fa-fw dropdown-toggle' }),
                            new Attributes({ 'data-toggle': 'dropdown' }),
                        ],
                    });
                    const dropdownContent = new DividerNode();
                    dropdownContent.modifiers.append(new Attributes({ class: 'dropdown-menu' }));
                    const dropdownContainer = new DividerNode();
                    dropdownContainer.modifiers.append(
                        new Attributes({ class: 'dropdown jw-dropdown jw-dropdown-textcolor' }),
                    );
                    dropdownContainer.append(button);
                    dropdownContainer.append(dropdownContent);
                    return [dropdownContainer];
                },
            },
            {
                id: 'OdooBackgroundColorButton',
                async render(): Promise<DividerNode[]> {
                    const button = new ActionableNode({
                        name: 'backgroundcolorpicker',
                        label: 'Background Color picker',
                        commandId: 'openBackgroundColorPicker',
                        modifiers: [
                            new Attributes({ class: 'fa fa-paint-brush fa-fw dropdown-toggle' }),
                            new Attributes({ 'data-toggle': 'dropdown' }),
                        ],
                    });
                    const dropdownContent = new DividerNode();
                    dropdownContent.modifiers.append(new Attributes({ class: 'dropdown-menu' }));
                    const dropdownContainer = new DividerNode();
                    dropdownContainer.modifiers.append(
                        new Attributes({
                            class: 'dropdown jw-dropdown jw-dropdown-backgroundcolor',
                        }),
                    );
                    dropdownContainer.append(button);
                    dropdownContainer.append(dropdownContent);
                    return [dropdownContainer];
                },
            },
            {
                id: 'OdooDiscardButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'discard',
                        label: 'Discard',
                        commandId: 'discardOdoo',
                        modifiers: [
                            new Attributes({ class: 'fa fa-times fa-fw jw-danger-button' }),
                        ],
                    });
                    return [button];
                },
            },
            {
                id: 'OdooSaveButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'save',
                        label: 'Save',
                        commandId: 'saveOdoo',
                        modifiers: [
                            new Attributes({ class: 'fa fa-save fa-fw jw-primary-button' }),
                        ],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [
            ['OdooLinkButton', ['actionables']],
            ['OdooMediaButton', ['actionables']],
            ['OdooDiscardButton', ['actionables']],
            ['OdooSaveButton', ['actionables']],
        ],
    };
}
