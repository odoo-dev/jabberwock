import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ThemeNode } from './ThemeNode';
import { Theme } from './Theme';

export class ThemeDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ThemeNode;

    async render(themeNode: ThemeNode): Promise<DomObject> {
        const themePlugin = this.engine.editor.plugins.get(Theme);
        const component = themePlugin.themes[themeNode.themeName];
        const nodes = await component.render(this.engine.editor);
        const domObjects: DomObject[] = [];
        for (const node of nodes) {
            const domObject = await this.engine.render(node);
            if (!domObjects.includes(domObject)) {
                await this._resolvePlaceholder(themeNode, domObject);
                domObjects.push(domObject);
            }
        }
        return { children: domObjects };
    }
    private async _resolvePlaceholder(theme: ThemeNode, domObject: DomObject): Promise<void> {
        await this.engine.resolveChildren(domObject);
        let placeholderFound = false;
        const domObjects: DomObject[] = [domObject];
        for (const domObject of domObjects) {
            this.engine.locations.delete(domObject);
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
}
