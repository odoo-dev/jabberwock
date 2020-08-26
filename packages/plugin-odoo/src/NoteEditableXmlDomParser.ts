import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { DividerNode } from '../../plugin-divider/src/DividerNode';
import { nodeName } from '../../utils/src/utils';
import { DividerXmlDomParser } from '../../plugin-divider/src/DividerXmlDomParser';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { VNode } from '../../core/src/VNodes/VNode';

export class NoteEditableXmlDomParser extends DividerXmlDomParser {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return (
            item instanceof Element &&
            nodeName(item) === 'DIV' &&
            item.classList.contains('note-editable')
        );
    };

    async parse(item: Element): Promise<DividerNode[]> {
        const divider = (await super.parse(item))[0];

        let looseChildren: VNode[] = [];
        const newChildren: VNode[] = [];
        for (const child of divider.childVNodes) {
            if (child instanceof AtomicNode) {
                looseChildren.push(child);
            } else {
                this.addChildren(newChildren, looseChildren);
                looseChildren = [];
                newChildren.push(child);
            }
        }
        this.addChildren(newChildren, looseChildren);
        divider.append(...newChildren);
        return [divider];
    }
    addChildren(mainChildren: VNode[], children: VNode[]): void {
        if (children.length) {
            const container = new this.engine.editor.configuration.defaults.Container();
            container.append(...children);
            mainChildren.push(container);
        }
    }
}
