import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { autoCloseTag } from './DefaultHtmlTextParser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { RenderingEngineCache } from '../../plugin-renderer/src/RenderingEngineCache';

export class HtmlTextRendereringEngine extends RenderingEngine<string> {
    static id = 'text/html';
    protected correspondingObjectRenderingId = DomObjectRenderingEngine.id;

    /**
     * @override
     */
    async render(
        nodes: VNode[],
        cache?: RenderingEngineCache<string>,
    ): Promise<RenderingEngineCache<string>> {
        cache = cache || new RenderingEngineCache(this);
        const renderer = this.editor.plugins.get(Renderer);
        const objectEngine = renderer.engines[
            this.correspondingObjectRenderingId
        ] as DomObjectRenderingEngine;
        const cacheDomObject = await objectEngine.render(nodes);
        for (const node of nodes) {
            const domObject = cacheDomObject.renderings.get(node);
            await objectEngine.resolveChildren(domObject, cacheDomObject.worker);
            const value = await this.domObjectToHtml(cache, domObject);
            cache.renderings.set(node, value);
        }
        return cache;
    }

    /**
     * Convert a domObject record into a string.
     *
     * @param domObject
     */
    async domObjectToHtml(
        cache: RenderingEngineCache<string>,
        domObject: DomObject,
    ): Promise<string> {
        let html = '';
        if ('tag' in domObject) {
            const tag = domObject.tag.toLocaleLowerCase();
            html += '<' + tag;
            if (domObject.attributes) {
                for (const name in domObject.attributes) {
                    const value = domObject.attributes[name];
                    if (name === 'style') {
                        if (Object.keys(value).length) {
                            html += ' style="';
                            for (const key in value as Record<string, string>) {
                                html += key + ':' + value[key] + ';';
                            }
                            html += '"';
                        }
                    } else if (name === 'class') {
                        if ((value as Set<string>).size) {
                            html +=
                                ' class="' +
                                [...(value as Set<string>)]
                                    .map(val => val.replace('"', '&quot;'))
                                    .join(' ') +
                                '"';
                        }
                    } else {
                        html += ' ' + name + '="' + (value as string).replace('"', '&quot;') + '"';
                    }
                }
            }
            if (domObject.children) {
                html += '>';
                for (const child of domObject.children) {
                    if (child instanceof AbstractNode) {
                        const renderings = await this.render([child], cache);
                        html += renderings[0];
                    } else {
                        html += await this.domObjectToHtml(cache, child);
                    }
                }
                html += '</' + tag + '>';
            } else if (autoCloseTag.includes(domObject.tag)) {
                html += '/>';
            } else {
                html += '></' + tag + '>';
            }
        } else if ('text' in domObject) {
            html = domObject.text.replace('<', '&lt;').replace('>', '&gt;');
        } else if ('children' in domObject) {
            for (const child of domObject.children) {
                if (child instanceof AbstractNode) {
                    const renderings = await this.render([child], cache);
                    html += renderings[0];
                } else {
                    html += await this.domObjectToHtml(cache, child);
                }
            }
        } else {
            for (const domNode of domObject.dom) {
                if (domNode instanceof Element) {
                    html += domNode.outerHTML;
                } else {
                    html = domNode.textContent.replace('<', '&lt;').replace('>', '&gt;');
                }
            }
        }
        return html;
    }
    /**
     * Register is not available for this rendering engine.
     *
     * @override
     */
    register(): void {
        // TODO: Textual rendering engines are not true rendering engine. Maybe
        // outputing as text should be an option when rendering using the object
        // engines ?
        throw new Error(
            'You can not add renderers to this engine. Please add the renderer as "' +
                this.correspondingObjectRenderingId +
                '".',
        );
    }
}
