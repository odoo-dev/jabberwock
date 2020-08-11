import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectAttributes,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from './Attributes';

export class AttributesDomObjectModifierRenderer extends ModifierRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = Attributes;

    /**
     * Rendering for Format Modifier.
     *
     * @param format
     * @param contents
     */
    async render(modifier: Attributes, contents: DomObject[]): Promise<DomObject[]> {
        const keys = modifier.keys();
        const classHistory: Record<string, boolean> = modifier.classList.history();
        if (keys.length || Object.keys(classHistory).length) {
            const attributes: DomObjectAttributes = {};
            for (const name of keys) {
                if (name === 'class') {
                    // This is going to use the class history feature anyway.
                    // TODO: This entire file should probably be reorganized to
                    // avoid using a `DomObjectAttributes` object in between.
                    attributes.class = new Set();
                } else if (name === 'style') {
                    attributes.style = modifier.style.toJSON();
                } else {
                    attributes[name] = modifier.get(name);
                }
            }
            const newContents = [];
            for (let index = 0; index < contents.length; index++) {
                let content = contents[index];
                if ('tag' in content) {
                    this._applyAttributes(content, attributes, classHistory);
                } else if (
                    'children' in content &&
                    !content.children.find(
                        domObject =>
                            !('tag' in domObject) &&
                            !('text' in domObject && domObject.text === '\u200b'),
                    )
                ) {
                    for (const child of content.children) {
                        if ('tag' in child) {
                            this._applyAttributes(child, attributes, classHistory);
                        }
                    }
                } else {
                    const children = [];
                    let newIndex = index;
                    while (
                        newIndex <= contents.length &&
                        ('text' in content ||
                            'dom' in content ||
                            ('children' in content && content.children.length))
                    ) {
                        if (!children.includes(content)) {
                            children.push(content);
                        }
                        newIndex++;
                    }
                    if (children.length) {
                        content = {
                            tag: 'SPAN',
                            attributes: Object.assign({}, attributes),
                            children: children,
                        };
                    }
                }
                newContents.push(content);
            }
            contents = newContents;
        }
        return contents;
    }

    private _applyAttributes(
        content: DomObjectElement,
        attributes: DomObjectAttributes,
        classHistory: Record<string, boolean>,
    ): void {
        if (!content.attributes) content.attributes = {};
        const attr = content.attributes;
        for (const name in attributes) {
            if (name === 'class') {
                this._applyClassHistory(content, classHistory);
            } else if (name === 'style') {
                attr.style = Object.assign({}, attributes.style, attr.style);
            } else {
                attr[name] = attributes[name];
            }
        }
    }

    /**
     * Apply the history of the class attributes stored in the given Record to
     * the given DomObject. Basically, if the DomObject is restoring a class
     * that used to be present in the class history, it will be reordered to
     * match its original position.
     *
     * @param content
     * @param classHistory
     */
    private _applyClassHistory(
        content: DomObjectElement,
        classHistory: Record<string, boolean>,
    ): void {
        // Reorganize `class` set to restore order thanks to ClassList history.
        const classNames = new Set<string>();
        if (content.attributes.class) {
            for (const className of content.attributes.class) {
                if (classHistory[className] !== false) {
                    classNames.add(className);
                }
            }
        }
        for (const className in classHistory) {
            if (classHistory[className] || content.attributes.class?.has(className)) {
                classNames.add(className);
            }
        }
        content.attributes.class = classNames;
    }
}
