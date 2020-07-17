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
        if (keys.length) {
            const attributes: DomObjectAttributes = {};
            for (const name of keys) {
                if (name === 'class') {
                    attributes.class = new Set(modifier.classList.items());
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
                    this._applyAttributes(content, attributes);
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
                            this._applyAttributes(child, attributes);
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

    private _applyAttributes(content: DomObjectElement, attributes: DomObjectAttributes): void {
        if (!content.attributes) content.attributes = {};
        const attr = content.attributes;
        for (const name in attributes) {
            if (name === 'class') {
                if (!attr.class) attr.class = new Set();
                for (const className of attributes.class) {
                    attr.class.add(className);
                }
            } else if (name === 'style') {
                attr.style = Object.assign({}, attributes.style, attr.style);
            } else {
                attr[name] = attributes[name];
            }
        }
    }
}
