import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ThemeNode } from './ThemeNode';
import { Theme } from './Theme';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';

export class ThemeDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ThemeNode;

    async render(themeNode: ThemeNode): Promise<DomObject> {
        const themePlugin = this.engine.editor.plugins.get(Theme);
        const component = themePlugin.themes[themeNode.themeName];
        const nodes = await component.render(this.engine.editor);
        const domObjects: DomObject[] = await this.engine.render(nodes);
        for (const domObject of domObjects) {
            await this._resolvePlaceholder(themeNode, domObject);
        }
        return this._removeRef({ children: domObjects });
    }
    private async _resolvePlaceholder(theme: ThemeNode, domObject: DomObject): Promise<void> {
        await this.engine.resolveChildren(domObject);
        let placeholderFound = false;
        const domObjects: DomObject[] = [domObject];
        for (const domObject of domObjects) {
            if ('tag' in domObject && domObject.tag === 'T-PLACEHOLDER') {
                if (!placeholderFound) {
                    delete domObject.tag;
                    domObject.children = theme.children();
                    placeholderFound = true;
                }
            } else if ('dom' in domObject) {
                if (!placeholderFound) {
                    for (const domNode of domObject.dom) {
                        const placeholder =
                            domNode instanceof Element && domNode.querySelector('T-PLACEHOLDER');
                        if (placeholder) {
                            for (const child of theme.children()) {
                                placeholder.parentNode.insertBefore(
                                    this.engine.renderPlaceholder(child),
                                    placeholder,
                                );
                            }
                            placeholder.parentNode.removeChild(placeholder);
                            placeholderFound = true;
                        }
                    }
                }
            } else if ('children' in domObject) {
                // Recursively apply on children in one stack.
                domObjects.push(...(domObject.children as DomObject[]));
            }
        }
    }
    private _removeRef(domObject: DomObject): DomObject {
        const domObjects = [domObject];
        for (const domObject of domObjects) {
            if ('children' in domObject) {
                for (let index = 0; index < domObject.children.length; index++) {
                    const child = domObject.children[index];
                    if (!(child instanceof AbstractNode)) {
                        domObject.children[index] = Object.create(child);
                        // Recursively apply on children in one stack.
                        domObjects.push(child);
                    }
                }
            }
        }
        return Object.create(domObject);
    }
}
