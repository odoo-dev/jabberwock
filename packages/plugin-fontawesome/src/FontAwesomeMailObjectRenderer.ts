import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { FontAwesomeNode } from './FontAwesomeNode';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { MailObjectRenderingEngine } from '../../plugin-mail/src/MailObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Stylesheet } from '../../plugin-stylesheet/src/Stylesheet';
import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { MailRenderingEngineWorker } from '../../plugin-mail/src/MailRenderingEngineCache';

const fontFamily = 'Font Awesome 5 Free';

export class FontAwesomeMailObjectRenderer extends NodeRenderer<DomObject> {
    static id = MailObjectRenderingEngine.id;
    engine: MailObjectRenderingEngine;
    predicate = FontAwesomeNode;

    fontLoader: Record<string, Promise<void>> = {};

    constructor(engine: RenderingEngine<DomObject>) {
        super(engine);
        this._loadFont(fontFamily);
    }

    async render(node: FontAwesomeNode, worker: MailRenderingEngineWorker): Promise<DomObject> {
        const fontawesome: DomObject = {
            tag: node.htmlTag,
            attributes: { style: {}, class: new Set(node.faClasses) },
        };
        this.engine.renderAttributes(Attributes, node, fontawesome, worker);
        const styleFromRules = await worker.getStyleFromCSSRules(node, fontawesome);

        // Get the current color.
        const color = (
            styleFromRules.current.color ||
            styleFromRules.inherit.color ||
            '#000000'
        ).replace(/\s/g, '');

        // Compute the current font-size.
        const size = parseInt(
            styleFromRules.current['font-size'] || styleFromRules.inherit['font-size'] || '14px',
            10,
        );
        const weight = parseInt(
            styleFromRules.current['font-weight'] || styleFromRules.inherit['font-weight'] || '400',
            10,
        );

        // Get the current font from the css stylesheet.
        const iconName = [...fontawesome.attributes.class].find(className =>
            className.startsWith('fa-'),
        );
        const stylesheet = this.engine.editor.plugins.get(Stylesheet);
        const styleFont = stylesheet.getFilteredStyleFromCSSRules(selector =>
            selector.includes(iconName + '::before'),
        );
        const font = styleFont.content.charCodeAt(1);
        const fontFamily = styleFromRules.current['font-family']?.slice(1, -1);
        if (!fontFamily) {
            return { children: [] };
        }

        await this._loadFont(fontFamily);

        const imgStyle = {
            'border-style': 'none',
            'max-width': '100%',
            'vertical-align': 'text-top',
            'height': 'auto',
            'width': 'auto',
        };

        const width = styleFromRules.current.width;
        if (width) {
            const margin = (parseFloat(width) - size) / 2;
            imgStyle['margin-left'] = margin + 'px';
            imgStyle['margin-right'] = margin + 'px';
        }

        // Create image instead of the font for mail client.
        const className = [...fontawesome.attributes.class].join('');
        let style = '';
        for (const key in fontawesome.attributes.style) {
            style += key + ':' + fontawesome.attributes.style[key] + ';';
        }

        const iconObject: DomObject = {
            tag: 'IMG',
            attributes: Object.assign({}, fontawesome.attributes, {
                'src': this._fontToBase64(fontFamily, font, size, color, weight),
                // odoo url: '/web_editor/font_to_img/' + font + '/' + window.encodeURI(color) + '/' + size,
                'data-fontname': iconName,
                'data-charcode': font.toString(),
                'data-size': size.toString(),
                'data-color': color,
                'data-class': className,
                'data-style': style,
                'class': new Set(
                    [...fontawesome.attributes.class].filter(className =>
                        className.startsWith('fa-'),
                    ),
                ),
                'style': imgStyle,
            }),
        };

        return iconObject;
    }

    /**
     * Load fonts for use in canvas.
     *
     * Fonts need to be loaded once for all canvas. Load the  font on a fake
     * canvas in order to have it already loaded when actually rendering it in
     * `_fontToBase64`.
     *
     * @param fontFamily
     */
    private async _loadFont(fontFamily: string): Promise<void> {
        if (!this.fontLoader[fontFamily]) {
            // Preload the font into canvas.
            const fontChar = String.fromCharCode(61770);
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 20;
            const ctx = canvas.getContext('2d');
            ctx.font = '12px "' + fontFamily + '"';
            ctx.fillStyle = '#000000';
            ctx.textBaseline = 'top';
            ctx.fillText(fontChar, 0, 0);
            // There is no way to wait for a promise for this. It is supposed
            // to only take one rendering pass (16ms) but it might take more if
            // the computer is overloaded. We arbitrarily choose to wait for 3
            // rendering passes (>48ms).
            this.fontLoader[fontFamily] = new Promise(r => setTimeout(r, 50));
        }
        return this.fontLoader[fontFamily];
    }
    /**
     * Create an base64 image from a font.
     *
     * @param fontFamily
     * @param font
     * @param fontSize
     * @param color
     * @param weight
     */
    private _fontToBase64(
        fontFamily: string,
        font: number,
        fontSize = 14,
        color = '#000000',
        weight = 400,
    ): string {
        const fontChar = String.fromCharCode(font);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = fontSize * 2;
        canvas.height = fontSize;

        // Draw the font and check the size.
        ctx.font = weight + ' ' + fontSize + 'px "' + fontFamily + '"';
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';

        ctx.fillText(fontChar, 0, 0);
        const w = canvas.width;
        const h = canvas.height;
        let realWidth = 1;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let y = 0; y < h; y++) {
            for (let x = realWidth; x < w; x++) {
                const index = (y * w + x) * 4;
                if (imageData.data[index + 3] > 0) {
                    realWidth = x + 1;
                }
            }
        }

        // Redraw the font with the good size.
        canvas.width = realWidth;
        ctx.font = weight + ' ' + fontSize + 'px "' + fontFamily + '"';
        ctx.fillStyle = color;
        ctx.textBaseline = 'top';
        ctx.fillText(fontChar, 0, 0);

        const image = canvas.toDataURL();

        return image;
    }
}
