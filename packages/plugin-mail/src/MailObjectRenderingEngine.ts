import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { DefaultMailObjectRenderer } from './DefaultMailObjectRenderer';
import { Stylesheet } from '../../plugin-stylesheet/src/Stylesheet';
import { VNode } from '../../core/src/VNodes/VNode';
import { ShadowNode } from '../../plugin-shadow/src/ShadowNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { RenderingEngineCache } from '../../plugin-renderer/src/RenderingEngineCache';
import { MailRenderingEngineCache, Styling, Hierarchy } from './MailRenderingEngineCache';

const TagWithBrowserCustomFontSize = [
    'BUTTON',
    'CODE',
    'H1',
    'H2',
    'H3',
    'H5',
    'H6',
    'KBD',
    'PRE',
    'SAMP',
    'SMALL',
    'SUB',
    'SUP',
];

const StyleSelectorParsingRegExp = /(.[\w-]*)$/;

/**
 * Converts css style to inline style (leave the classes on elements but forces
 * the style they give as inline style).
 */

export class MailObjectRenderingEngine extends DomObjectRenderingEngine {
    static readonly id = 'object/mail';
    static readonly defaultRenderer = DefaultMailObjectRenderer;
    static extends = [DomObjectRenderingEngine.id];

    /**
     * Render the given node and every children. Begin the rendering from the
     * shadowNode ancestor.
     * The shadow nodes must be rendered into the domLayout.
     *
     * @param node
     */
    async render(
        nodes: VNode[],
        cache?: MailRenderingEngineCache,
    ): Promise<RenderingEngineCache<DomObject>> {
        cache = cache || new MailRenderingEngineCache(this);

        if (!nodes.find(node => !cache.renderingPromises.get(node))) {
            return super.render(nodes, cache);
        }

        const ancestors = new Set<VNode>(nodes);
        let shadows: ShadowNode[] = [];
        for (let node of nodes) {
            let shadow: ShadowNode;
            while (!shadow && node.parent && !ancestors.has(node.parent)) {
                node = node.parent;
                ancestors.add(node);
                if (node instanceof ShadowNode && !shadows.includes(node)) {
                    shadow = node;
                }
            }
            if (shadow) {
                shadows.push(shadow);
            } else if (!ancestors.has(node.parent)) {
                throw new Error(
                    'The content to render into mail/html formatting must be in at least shadow node.',
                );
            }
        }

        // Get the ShadowRoot of all shadowNode.
        for (const shadow of shadows) {
            if (!cache.shadowRoots.has(shadow)) {
                // TODO: load stylesheet without the dom in Stylesheet.
                const domLayout = this.editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const [shadowNode] = domLayout.getDomNodes(shadow) as Element[];
                const shadowRoot = shadowNode.shadowRoot;
                cache.shadowRoots.set(shadow, shadowRoot);
            }
        }

        // Get all children in order.
        shadows = shadows.filter(
            shadow => !shadow.ancestors(ShadowNode).find(ancestor => shadows.includes(ancestor)),
        );
        const nodesToRender: [ShadowNode, ...VNode[]][] = shadows.map(shadow => [shadow]);
        for (const nodes of nodesToRender) {
            for (let index = 0; index < nodes.length; index++) {
                const node = nodes[index];
                if (node instanceof ContainerNode) {
                    nodes.splice(index + 1, 0, ...node.childVNodes);
                }
            }
        }

        // Apply style of nodes.
        for (const [shadow, ...nodes] of nodesToRender) {
            // Render the shadowNode and all children.
            await super.render(nodes, cache);
            await this._applyStyleFromRules(cache, shadow, nodes);
        }

        return cache;
    }
    /**
     * Returns the css rules which applies on an node. Tweaked so that they are
     * browser/mail client ok.
     *
     * @param {VNode} Node
     * @param {DomObject} rendering Value of the renderer result.
     * @param {DomObject} domObject DomObject returned into the rendering (can be the same object)
     * @param {DomObject} rendering DomObject returned by the renderer
     */
    async getStyleFromCSSRules(
        cache: MailRenderingEngineCache,
        node: VNode,
        domObject: DomObject,
        rendering?: DomObject,
    ): Promise<Styling> {
        if (cache.inheritedStyling.get(domObject)) {
            return cache.inheritedStyling.get(domObject);
        }
        if (!rendering) {
            rendering = domObject;
        }
        const shadow = node.ancestor(ShadowNode);
        const shadowRoot = cache.shadowRoots.get(shadow);
        const hierarchy = await this._getHierarchy(cache, node, domObject, rendering);
        const styling = await this._getStyleFromCSSRules(cache, domObject, shadowRoot, hierarchy);

        // Remove this current referencie for renderings call, to recompute it after.
        cache.inheritedStyling.delete(domObject);
        cache.promiseHierarchy.delete(domObject);
        cache.promiseHierarchy.delete(node);
        cache.parented.delete(domObject);
        cache.parented.delete(node);

        return styling;
    }
    private async _applyStyleFromRules(
        cache: MailRenderingEngineCache,
        shadow: ShadowNode,
        nodes: VNode[],
    ): Promise<void> {
        const shadowRoot = cache.shadowRoots.get(shadow);

        const alreadyConverted = new Set<DomObject>();
        for (const node of nodes) {
            const rendering = await cache.renderings.get(node);
            const renderings = [rendering];
            for (const domObject of renderings) {
                if (!alreadyConverted.has(rendering)) {
                    alreadyConverted.add(rendering);
                    const hierarchy = await this._getHierarchy(cache, node, domObject, rendering);
                    if ('tag' in domObject) {
                        const styling = await this._getStyleFromCSSRules(
                            cache,
                            domObject,
                            shadowRoot,
                            hierarchy,
                        );
                        if (!domObject.attributes) {
                            domObject.attributes = {};
                        } else {
                            delete domObject.attributes.contentEditable;
                        }
                        domObject.attributes.style = styling.current;
                    }
                }
            }
        }
    }
    private async _getStyleFromCSSRules(
        cache: MailRenderingEngineCache,
        domObject: DomObject,
        shadowRoot: ShadowRoot,
        ancestors: { domObject: DomObjectElement; node: VNode }[],
    ): Promise<Styling> {
        if (cache.inheritedStyling.get(domObject)) {
            return cache.inheritedStyling.get(domObject);
        }

        const parentStyling =
            ancestors.length &&
            (await this._getStyleFromCSSRules(
                cache,
                ancestors[0].domObject,
                shadowRoot,
                ancestors.slice(1),
            ));

        const inherit = Object.assign({}, parentStyling?.inherit);

        for (const prop in parentStyling?.current) {
            const value = parentStyling.current[prop];
            if (value?.includes('important') || !inherit[prop]?.includes('important')) {
                inherit[prop] = value;
            }
        }

        let style: Record<string, string>;
        if ('tag' in domObject) {
            const tag = domObject.tag.toUpperCase();
            const stylesheet = this.editor.plugins.get(Stylesheet);

            style = stylesheet.getFilteredStyleFromCSSRules(
                selector => this._selectorMatchesDomObject(domObject, selector, ancestors),
                shadowRoot,
            );
            style = Object.assign(style, domObject.attributes?.style);

            if (!style['font-size'] && TagWithBrowserCustomFontSize.includes(tag)) {
                const rootFontSize = this._getDefaultFontSize(cache, 'p');
                const em = this._getDefaultFontSize(cache, tag) / rootFontSize;
                style['font-size'] = em + 'em';
            }

            for (const prop in style) {
                const value = style[prop];
                if (inherit[prop]?.includes('important')) {
                    delete style[prop];
                } else if (value === 'inherit') {
                    // Take the inherit value.
                    if (inherit[prop]) {
                        style[prop] = inherit[prop];
                    } else {
                        delete style[prop];
                    }
                } else if (/[0-9]/.test(value)) {
                    // For numeric value, compute in px.
                    // Numeric value => all, vertical & horizontal, top & right & bottom & left.
                    const subValues = value.split(' ');
                    for (const index in subValues) {
                        const subValue = subValues[index];
                        const numeric = parseFloat(subValue);
                        if (!isNaN(numeric) && subValue.includes('em')) {
                            // Convert 'em' and 'rem' values into 'px' values.
                            let previous: number;
                            if (!subValue.includes('rem') && inherit['font-size']) {
                                previous = parseFloat(inherit['font-size']);
                            } else {
                                previous = this._getDefaultFontSize(
                                    cache,
                                    ancestors[0]?.domObject.tag || 'p',
                                );
                            }
                            subValues[index] =
                                numeric * previous +
                                'px' +
                                (value.includes('important') ? '!important' : '');
                        }
                    }
                    style[prop] = subValues.join(' ');
                }
            }

            if (style.display === 'block') {
                delete style.display;
            }
        } else {
            style = {};
        }

        cache.inheritedStyling.set(domObject, { current: style, inherit });
        return cache.inheritedStyling.get(domObject);
    }
    private _getDefaultFontSize(cache: MailRenderingEngineCache, tag: string): number {
        if (cache.defaultFontSize[tag]) {
            return cache.defaultFontSize[tag];
        } else {
            // Default value in the browser.
            const container = document.createElement('div');
            container.attachShadow({ mode: 'open' });
            const p = document.createElement(tag);
            container.shadowRoot.appendChild(p);
            document.body.appendChild(container);
            const size = parseFloat(window.getComputedStyle(p)['font-size']);
            document.body.removeChild(container);
            cache.defaultFontSize[tag] = size;
            return size;
        }
    }
    /**
     * Check if the css rule selector match with the current domObject.
     * (eg: div#id span.toto > a )
     *
     * @param domObject
     * @param selector
     * @param ancestors
     */
    private _selectorMatchesDomObject(
        domObject: DomObjectElement,
        selector: string,
        ancestors: { domObject: DomObject; node: VNode }[],
    ): boolean {
        if (
            selector.includes(':hover') ||
            selector.includes(':before') ||
            selector.includes(':after') ||
            selector.includes(':active') ||
            selector.includes(':link') ||
            selector.includes('::')
        ) {
            // This cannot be translated to a style attribute on an html node.
            return;
        }

        if (selector.includes('[') || selector.includes(':')) {
            // TODO: add support to select attributes and pseudo-classes.
            return false;
        }

        if (selector.includes('~') || selector.includes('+')) {
            // TODO: add support for all combinators.
            return false;
        }

        const parts = selector.split(' ');
        const part = parts.pop();
        if (!this._basicSelectorMatchesDomObject(domObject, part)) {
            return;
        }

        const origins = ancestors.map(ancestor => ancestor.domObject) as DomObjectElement[];
        origins.unshift(domObject);

        let availableOrigin = origins;
        while (parts.length) {
            let part = parts.pop();
            const newOrigins = [];
            if (part === '>') {
                part = parts.pop();
                for (const origin of availableOrigin) {
                    const ancestor = origins[origins.indexOf(origin) + 1];
                    if (ancestor && this._basicSelectorMatchesDomObject(ancestor, part)) {
                        newOrigins.push(ancestor);
                    }
                }
            } else {
                for (const origin of availableOrigin) {
                    const ancestors = origins.slice(origins.indexOf(origin) + 1);
                    for (const ancestor of ancestors) {
                        if (ancestor && this._basicSelectorMatchesDomObject(ancestor, part)) {
                            newOrigins.push(ancestor);
                        }
                    }
                }
            }
            if (!newOrigins.length) {
                // No parent to validate the selector.
                return;
            }
            availableOrigin = newOrigins;
        }
        return true;
    }
    /**
     * Check if the part of css rule selector match with the current domObject.
     * (eg: div#id )
     *
     * @param domObject
     * @param selector
     */
    private _basicSelectorMatchesDomObject(domObject: DomObjectElement, selector: string): boolean {
        let selectorPart = selector.toUpperCase();
        while (selectorPart) {
            const part = selectorPart.match(StyleSelectorParsingRegExp)[1];
            selectorPart = selectorPart.slice(0, -part.length);
            if (part[0] === '.') {
                if (!domObject.attributes?.class) {
                    return false;
                }
                const className = part.slice(1).toLowerCase();
                if (!domObject.attributes.class.has(className)) {
                    return false;
                }
            } else if (part[0] === '#') {
                if (!domObject.attributes?.id) {
                    return false;
                }
                const id = part.slice(1).toUpperCase();
                if ((domObject.attributes.id as string).toUpperCase() !== id) {
                    return false;
                }
            } else if (part !== '*' && part.toUpperCase() !== domObject.tag.toUpperCase()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get the parented object.
     *
     * @param node
     * @param domObject
     * @param rendering
     */
    private _getHierarchy(
        cache: MailRenderingEngineCache,
        node: VNode,
        domObject?: DomObject,
        rendering?: DomObject,
    ): Promise<Hierarchy> {
        if (cache.promiseHierarchy.get(domObject || node)) {
            return cache.promiseHierarchy.get(domObject || node);
        }
        if (node instanceof ShadowNode) {
            return Promise.resolve([]);
        }
        const promise = this.__getHierarchy(cache, node, domObject, rendering);

        if (domObject) {
            cache.promiseHierarchy.set(domObject, promise);
        }
        if (!domObject || domObject === rendering) {
            cache.promiseHierarchy.set(node, promise);
        }
        return cache.promiseHierarchy.get(domObject || node);
    }
    private async __getHierarchy(
        cache: MailRenderingEngineCache,
        node: VNode,
        rendering?: DomObject,
        domObject?: DomObject,
    ): Promise<Hierarchy> {
        if (!domObject) {
            domObject = rendering;
        }
        let rootNode: VNode;
        let rootRendering: DomObject;

        if (domObject === rendering) {
            rootNode = node.parent;
            if (!(rootNode instanceof ShadowNode)) {
                await Promise.resolve(); // Avoid cycle in render process.
                await super.render([rootNode], cache);
                await this._applyStyleFromRules(cache, rootNode.ancestor(ShadowNode), [rootNode]);
                rootRendering = cache.renderings.get(rootNode);
            }
        } else {
            rootNode = node;
            rootRendering = rendering;
        }

        const ancestors = rootRendering
            ? (this._getPath(rootRendering, domObject, node).filter(
                  ancestor => 'tag' in ancestor,
              ) as DomObjectElement[])
            : [];
        const hierarchy = ancestors
            .map(domObject => {
                return {
                    domObject: domObject,
                    node: rootNode,
                };
            })
            .concat(await this._getHierarchy(cache, node.parent));

        if (domObject) {
            cache.parented.set(domObject, hierarchy);
        }
        if (!domObject || domObject === rendering) {
            cache.parented.set(node, hierarchy);
        }
        return hierarchy;
    }

    private _getPath(root: DomObject, item: DomObject, node: VNode): DomObject[] {
        if ('children' in root) {
            if (root.children.includes(item) || root.children.includes(node)) {
                return [root];
            } else {
                for (const child of root.children) {
                    if (!(child instanceof AbstractNode)) {
                        const path = this._getPath(child, item, node);
                        if (path.length) {
                            return path.concat([root]);
                        }
                    }
                }
            }
        }
        return [];
    }

    // TODO: add mail renderer for media document.
    // /**
    //  * Converts css display for attachment link to real image.
    //  * Without this post process, the display depends on the css and the picture
    //  * does not appear when we use the html without css (to send by email for e.g.)
    //  *
    //  * @param {jQuery} $editable
    //  */
    // attachmentThumbnailToLinkImg($editable) {
    //     $editable
    //         .find('a[href*="/web/content/"][data-mimetype]')
    //         .filter(':empty, :containsExact( )')
    //         .each(function() {
    //             const $link = $(this);
    //             const $img = $('<img/>')
    //                 .attr(
    //                     'src',
    //                     $link.css('background-image').replace(/(^url\(['"])|(['"]\)$)/g, ''),
    //                 )
    //                 .css('height', Math.max(1, $link.height()) + 'px')
    //                 .css('width', Math.max(1, $link.width()) + 'px');
    //             $link.prepend($img);
    //         });
    // }
}
