import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { OdooFieldNode } from './OdooFieldNode';

import { VNode } from '../../core/src/VNodes/VNode';
import { OdooFieldInfo, OdooRecordDefinition } from './OdooField';
import { OdooField } from './OdooField';
import { MarkerNode } from '../../core/src/VNodes/MarkerNode';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/ui/DomLayoutEngine';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

/**
 * Clone all the children recursively.
 */
export function cloneChildrenDeep(node: VNode): VNode[] {
    return node
        .children()
        .filter(node => !(node instanceof MarkerNode))
        .map(child => {
            const clonedNode = child.clone();
            if (child instanceof ContainerNode) {
                clonedNode.append(...cloneChildrenDeep(child));
            }
            return clonedNode;
        });
}
export class OdooFieldDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;
    predicate = (item: Node): boolean => {
        return (
            item instanceof Element &&
            item.attributes['data-oe-type'] &&
            item.attributes['data-oe-model'] &&
            (item.attributes['data-oe-type'].value === 'char' ||
                item.attributes['data-oe-type'].value === 'text' ||
                item.attributes['data-oe-type'].value === 'html' ||
                item.attributes['data-oe-type'].value === 'float' ||
                item.attributes['data-oe-type'].value === 'integer')
        );
        // TODO: Handle thoses fields when their dependecies will be met.
        // item.attributes['data-oe-type'].value === 'many2one' ||
        // item.attributes['data-oe-type'].value === 'date' ||
        // item.attributes['data-oe-type'].value === 'datetime'
        // item.attributes['data-oe-type'].value === 'image' ||
        // item.attributes['data-oe-type'].value === 'contact'
    };
    _reactiveChangeExample: Map<OdooFieldInfo, OdooFieldNode> = new Map();
    _nextRenders: Function[] = [];

    constructor(engine) {
        super(engine);
        this._beforeRenderInEditable = this._beforeRenderInEditable.bind(this);
    }

    async parse(element: HTMLElement): Promise<OdooFieldNode[]> {
        // ? dmo: We need to discuss about a way to send signals to the dom in a
        // better way because the following code create a dependecy to the dom.
        // I'm not sure we want to code this dependecy that way.
        // TODO: Also, The layout is not yet in the editor when calling the
        // constructor. So this code should move.
        const layout = this.engine.editor.plugins.get(Layout);
        const domLayout = layout.engines[DomLayoutEngine.id] as DomLayoutEngine;
        if (!domLayout.beforeRenderInEditable.find(this._beforeRenderInEditable)) {
            domLayout.beforeRenderInEditable.push(this._beforeRenderInEditable);
        }
        const record: OdooRecordDefinition = {
            modelId: element.attributes['data-oe-model'].value,
            recordId: element.attributes['data-oe-id'].value,
            fieldName: element.attributes['data-oe-field'].value,
        };

        // data-oe-type is kind of a widget in Odoo.
        const fieldWidgetType = element.attributes['data-oe-type'].value;
        const reactivePlugin = this.engine.editor.plugins.get(OdooField);
        reactivePlugin.setRecordFromParsing(
            record,
            fieldWidgetType,
            this._getValueFromParsing(element),
        );
        const odooReactiveField = reactivePlugin.getField(record);

        const fieldNode = await this._getNode(element, odooReactiveField);
        fieldNode.modifiers.append(this.engine.parseAttributes(element));

        // TODO: This mute mechanism can be removed once the changes will be hooked with the memory.
        // This allow to not cycle when changing it's own children (empty and append).
        let mute = false;
        // TODO: When the memory will be merged, observe the change from it. This code is
        //       inefficient as it deep-clone and re-render for each changes made in the descendants
        //       of the fieldNode.
        fieldNode.on('childList', async () => {
            this._nextRenders.push(async () => {
                if (mute) return;
                const renderer = this.engine.editor.plugins.get(Renderer);
                // Clone the fieldNode otherwise the renderer will change the mapping of the fieldNode.
                const clonedNode = fieldNode.clone();
                const childs = cloneChildrenDeep(fieldNode);
                clonedNode.empty();
                clonedNode.append(...childs);
                const renderedNodes = await renderer.render<Node[]>(
                    HtmlDomRenderingEngine.id,
                    clonedNode,
                );
                const renderedNode = renderedNodes[0];
                this._reactiveChangeExample.set(fieldNode.fieldInfo, fieldNode);
                await fieldNode.fieldInfo.value.set(
                    this._getValueFromRedering(renderedNode as HTMLElement),
                );
            });
        });

        // The listening of the value mechanism can be removed once the mirror nodes are available.
        fieldNode.fieldInfo.value.on('set', () => {
            // Retrieving the node that made the change is a hack that will be removed when the
            // mirror nodes are available.
            const fieldNodeToCopy = this._reactiveChangeExample.get(fieldNode.fieldInfo);
            if (fieldNodeToCopy === fieldNode) return;
            mute = true;
            const childs = cloneChildrenDeep(fieldNodeToCopy);
            fieldNode.empty();
            fieldNode.append(...childs);
            mute = false;
        });
        return [fieldNode];
    }
    /**
     * Get the value of `element` when parsing.
     */
    _getValueFromParsing(element: HTMLElement): string {
        return element.innerHTML;
    }
    /**
     * Get the value of `element` when rendering.
     */
    _getValueFromRedering(element: HTMLElement): string {
        return this._getValueFromParsing(element);
    }

    /**
     * Get an `OdooFieldNode` from an element and a ReactiveValue.
     */
    async _getNode(element: HTMLElement, fieldInfo: OdooFieldInfo): Promise<OdooFieldNode> {
        const childNodesToParse = element.childNodes;
        const fieldNode = new OdooFieldNode({ htmlTag: element.tagName, fieldInfo });
        const children = await this.engine.parse(...childNodesToParse);
        fieldNode.append(...children);
        return fieldNode;
    }

    async _beforeRenderInEditable(): Promise<void> {
        console.log('beforerender');
        while (this._nextRenders.length) {
            const cb = this._nextRenders.shift();
            await cb();
        }
    }
}
