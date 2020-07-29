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
import { ReactiveValue } from '../../utils/src/ReactiveValue';
import { AlignType, Align } from '../../plugin-align/src/Align';
import { Bold } from '../../plugin-bold/src/Bold';
import { Underline } from '../../plugin-underline/src/Underline';
import { BoldFormat } from '../../plugin-bold/src/BoldFormat';
import { ItalicFormat } from '../../plugin-italic/src/ItalicFormat';
import { UnderlineFormat } from '../../plugin-underline/src/UnderlineFormat';
import { List } from '../../plugin-list/src/List';
import { ListType } from '../../plugin-list/src/ListNode';

interface SelectionInfo {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    alignment: AlignType | null;
    listType: ListType | null;
}

export class Odoo<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline, Link, Xml, Bold, Inline, Underline, Align, List];
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
                            return node && node.is(InlineNode) && !!node.modifiers.find(LinkFormat);
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
                id: 'OdooColorPickerButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'colorpicker',
                        label: 'Color picker',
                        commandId: 'openColorPicker',
                        modifiers: [new Attributes({ class: 'fa fa-eyedropper fa-fw' })],
                    });
                    return [button];
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

    formatInfo: ReactiveValue<SelectionInfo> = new ReactiveValue({
        bold: false,
        italic: false,
        underline: false,
        alignment: null,
        listType: null,
    });

    commandHooks = {
        '*': this._updateInfo,
    };

    /**
     * Update the information of the `formatInfo`.
     */
    private _updateInfo(): void {
        const inline = this.editor.plugins.get(Inline);
        const alignementType = Align.selectedAlignement(this.editor.selection.range);
        const listType = List.selectedListType(this.editor.selection.range);

        const newLocal = {
            bold: inline.isAllFormat(BoldFormat),
            italic: inline.isAllFormat(ItalicFormat),
            underline: inline.isAllFormat(UnderlineFormat),
            alignment: alignementType,
            listType: listType,
        };
        this.formatInfo.set(newLocal);
    }
}
