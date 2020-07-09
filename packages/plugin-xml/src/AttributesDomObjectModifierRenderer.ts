import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
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
            const attributes = {};
            for (const name of keys) {
                attributes[name] = modifier.get(name);
            }
            const newContents = [];
            for (let index = 0; index < contents.length; index++) {
                let content = contents[index];
                if ('tag' in content) {
                    if (content.attributes) {
                        for (const name of keys) {
                            if (!(name in content.attributes)) {
                                content.attributes[name] = attributes[name];
                            }
                        }
                    } else {
                        content.attributes = {};
                        for (const name of keys) {
                            content.attributes[name] = attributes[name];
                        }
                    }
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
                            if (child.attributes) {
                                for (const name of keys) {
                                    if (!(name in child.attributes)) {
                                        child.attributes[name] = attributes[name];
                                    }
                                }
                            } else {
                                child.attributes = {};
                                for (const name of keys) {
                                    child.attributes[name] = attributes[name];
                                }
                            }
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
}
