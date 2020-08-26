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
import { ImageNode } from '../../plugin-image/src/ImageNode';
import { VRange } from '../../core/src/VRange';
import { CommandParams } from '../../core/src/Dispatcher';
import { ComponentDefinition } from '../../plugin-layout/src/LayoutEngine';
import { InsertTableParams } from '../../plugin-table/src/Table';
import { TableNode } from '../../plugin-table/src/TableNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { HeadingParams } from '../../plugin-heading/src/Heading';
import { isTextVisible } from '../../utils/src/utils';
import { NoteEditableXmlDomParser } from './NoteEditableXmlDomParser';

export enum OdooPaddingClasses {
    NONE = 'padding-none',
    SMALL = 'padding-small',
    MEDIUM = 'padding-medium',
    LARGE = 'padding-large',
    XL = 'padding-xl',
}

const paddingClassesLabels = {
    [OdooPaddingClasses.NONE]: 'None',
    [OdooPaddingClasses.SMALL]: 'Small',
    [OdooPaddingClasses.MEDIUM]: 'Medium',
    [OdooPaddingClasses.LARGE]: 'Large',
    [OdooPaddingClasses.XL]: 'XL',
};

const paddingClasses = Object.keys(paddingClassesLabels);

export enum OdooImageClasses {
    ROUNDED = 'rounded',
    ROUNDED_CIRCLE = 'rounded-circle',
    SHADOW = 'shadow',
    IMG_THUMBNAIL = 'img-thumbnail',
}

const imageClassesLabels = {
    [OdooImageClasses.ROUNDED]: 'Rounded',
    [OdooImageClasses.ROUNDED_CIRCLE]: 'Circle',
    [OdooImageClasses.SHADOW]: 'Shadow',
    [OdooImageClasses.IMG_THUMBNAIL]: 'Thumbnail',
};

/**
 * Get one image targeted within the range.
 * If more images are within the range, return undefined.
 */
function getSingleImage(range: VRange): ImageNode | undefined {
    const next = range.start.nextLeaf();
    if (next instanceof ImageNode) {
        const prev = range.end.previousLeaf();
        if (prev === next) {
            return next;
        }
    }
}
/**
 * Check if there is exactly one image within the editor range
 */
function isImageVisible(editor: JWEditor): boolean {
    return !!getSingleImage(editor.selection.range);
}

export interface SetPaddingParams extends CommandParams {
    /**
     * The name of the padding class.
     */
    className: OdooPaddingClasses;
}

export interface SetImageWidthParams extends CommandParams {
    /**
     * The width of the image in percentage (e.g. "10") or "auto" to remove the
     * width attribute.
     */
    width: string;
}

export interface SetImageClassParams extends CommandParams {
    className: OdooImageClasses;
}

export class Odoo<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline, Link, Xml];
    readonly loadables: Loadables<Parser & Renderer & Layout> = {
        parsers: [NoteEditableXmlDomParser, OdooStructureXmlDomParser, OdooTranslationXmlDomParser],
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
                        visible: isTextVisible,
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
                        visible: isTextVisible,
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
            this._makeImagePaddingComponent(
                'OdooImagePaddingNoneActionable',
                OdooPaddingClasses.NONE,
            ),
            this._makeImagePaddingComponent(
                'OdooImagePaddingSmallActionable',
                OdooPaddingClasses.SMALL,
            ),
            this._makeImagePaddingComponent(
                'OdooImagePaddingMediumActionable',
                OdooPaddingClasses.MEDIUM,
            ),
            this._makeImagePaddingComponent(
                'OdooImagePaddingLargeActionable',
                OdooPaddingClasses.LARGE,
            ),
            this._makeImagePaddingComponent('OdooImagePaddingXLActionable', OdooPaddingClasses.XL),

            this._makeImageWidthComponent('OdooImageWidthAutoActionable', 'auto'),
            this._makeImageWidthComponent('OdooImageWidth25Actionable', '25'),
            this._makeImageWidthComponent('OdooImageWidth50Actionable', '50'),
            this._makeImageWidthComponent('OdooImageWidth75Actionable', '75'),
            this._makeImageWidthComponent('OdooImageWidth100Actionable', '100'),

            this._makeImageClassComponent(
                'OdooImageRoundedActionable',
                OdooImageClasses.ROUNDED,
                'fa-square',
            ),
            this._makeImageClassComponent(
                'OdooImageRoundedCircleActionable',
                OdooImageClasses.ROUNDED_CIRCLE,
                'fa-circle-o',
            ),
            this._makeImageClassComponent(
                'OdooImageRoundedShadowActionable',
                OdooImageClasses.SHADOW,
                'fa-sun-o',
            ),
            this._makeImageClassComponent(
                'OdooImageRoundedThumbnailActionable',
                OdooImageClasses.IMG_THUMBNAIL,
                'fa-picture-o',
            ),

            {
                id: 'OdooCropActionable',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'crop-image',
                        label: 'Crop',
                        commandId: 'cropImage',
                        modifiers: [new Attributes({ class: 'fa fa-crop fa-fw' })],
                        visible: isImageVisible,
                    });
                    return [button];
                },
            },
            {
                id: 'OdooTransformActionable',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'transform-image',
                        label: 'Transform',
                        commandId: 'transformImage',
                        modifiers: [new Attributes({ class: 'fa fa-object-ungroup fa-fw' })],
                        visible: isImageVisible,
                    });
                    return [button];
                },
            },
            {
                id: 'OdooDescriptionActionable',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'describe-image',
                        label: 'Description',
                        commandId: 'describeImage',
                        visible: isImageVisible,
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

    commands = {
        setImagePadding: {
            handler: this.setImagePadding,
        },
        setImageWidth: {
            handler: this.setImageWidth,
        },
        setImageClass: {
            handler: this.setImageClass,
        },
    };
    commandHooks = {
        insertTable: async (params: InsertTableParams): Promise<void> => {
            if (params.rowCount && params.columnCount) {
                const range = params.context.range;
                const table = range.start.ancestor(TableNode);
                if (table) {
                    const attributes = table.modifiers.get(Attributes);
                    attributes.classList.add('table table-bordered');
                    attributes.style.set('position', 'relative');
                }
            }
        },
        applyHeadingStyle: async (params: HeadingParams): Promise<void> => {
            for (const node of params.context.range.targetedNodes(CharNode)) {
                node.modifiers.get(Attributes).style.remove('font-size');
            }
        },
    };

    setImagePadding(params: SetPaddingParams): void {
        const image = getSingleImage(params.context.range);
        if (image) {
            const classList = image.modifiers.get(Attributes).classList;
            for (const className of paddingClasses) {
                classList.remove(className);
            }
            if (params.className === 'padding-none') return;
            classList.add(params.className);
        }
    }
    setImageWidth(params: SetImageWidthParams): void {
        const image = getSingleImage(params.context.range);
        if (image) {
            const style = image.modifiers.get(Attributes).style;
            if (params.width === 'auto') {
                style.remove('width');
            } else {
                style.set('width', params.width + '%');
            }
        }
    }
    setImageClass(params: SetImageClassParams): void {
        const image = getSingleImage(params.context.range);
        if (image) {
            const classList = image.modifiers.get(Attributes).classList;
            classList.toggle(params.className);
        }
    }

    _makeImagePaddingComponent(
        componentId: string,
        className: OdooPaddingClasses,
    ): ComponentDefinition {
        const component: ComponentDefinition = {
            id: componentId,
            async render(): Promise<ActionableNode[]> {
                const params: SetPaddingParams = {
                    className: className,
                };
                const button = new ActionableNode({
                    name: `set-${className}`,
                    label: paddingClassesLabels[className],
                    commandId: 'setImagePadding',
                    commandArgs: params,
                    visible: isImageVisible,
                    selected: (editor: JWEditor): boolean => {
                        const image = getSingleImage(editor.selection.range);
                        if (image) {
                            const imageAttribute = image.modifiers.get(Attributes);
                            if (className === OdooPaddingClasses.NONE) {
                                if (
                                    paddingClasses.every(
                                        className => !imageAttribute.has(className),
                                    )
                                ) {
                                    return true;
                                }
                            } else {
                                imageAttribute.classList.has(className);
                            }
                        }
                        return false;
                    },
                });
                return [button];
            },
        };
        return component;
    }
    _makeImageWidthComponent(componentId: string, width: string): ComponentDefinition {
        const component: ComponentDefinition = {
            id: componentId,
            async render(): Promise<ActionableNode[]> {
                const params: SetImageWidthParams = {
                    width: width,
                };
                const button = new ActionableNode({
                    name: `set-image-width-${width}`,
                    label: width === 'auto' ? 'auto' : width + '%',
                    commandId: 'setImageWidth',
                    commandArgs: params,
                    visible: isImageVisible,
                    selected: (editor: JWEditor): boolean => {
                        const image = getSingleImage(editor.selection.range);
                        if (image) {
                            const imageAttribute = image.modifiers.get(Attributes);
                            return parseInt(imageAttribute.style.get('width')) === parseInt(width);
                        }
                        return false;
                    },
                });
                return [button];
            },
        };
        return component;
    }
    _makeImageClassComponent(
        componentId: string,
        className: OdooImageClasses,
        faIcon: string,
    ): ComponentDefinition {
        const component: ComponentDefinition = {
            id: componentId,
            async render(): Promise<ActionableNode[]> {
                const params: SetImageClassParams = { className };
                const button = new ActionableNode({
                    name: `set-image-class-${className}`,
                    label: imageClassesLabels[className],
                    commandId: 'setImageClass',
                    commandArgs: params,
                    modifiers: [new Attributes({ class: `fa ${faIcon} fa-fw` })],
                    visible: isImageVisible,
                    selected: (editor: JWEditor): boolean => {
                        const image = getSingleImage(editor.selection.range);
                        if (image) {
                            const imageAttribute = image.modifiers.get(Attributes);
                            return imageAttribute.classList.has(className);
                        }
                        return false;
                    },
                });
                return [button];
            },
        };
        return component;
    }
}
