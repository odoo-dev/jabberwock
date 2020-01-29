import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import JWEditor from '../core/src/JWEditor';
import { EventManager } from './EventManager';
import { DomRenderer } from '../plugin-dom/DomRenderer';
import { VDocumentMap } from '../core/src/VDocumentMap';
import { Direction } from '../core/src/VSelection';
import { VNode, RelativePosition } from '../core/src/VNodes/VNode';

type VNodeID = number;
export interface TextNodeJSON {
    textContent: string;
}
export interface ElementJSON {
    nodeName: string;
    attributes: Record<string, string | Set<string>>;
    childNodes: Array<NodeJSON | VNodeID>;
}
export type NodeJSON = ElementJSON | TextNodeJSON;

export class ContentEditable extends JWPlugin {
    editable: HTMLElement;
    renderer: DomRenderer;
    eventManager: EventManager;
    vNodejSONMap: Map<VNode, NodeJSON> = new Map();
    vDocumentMap = new VDocumentMap();

    commandHooks = {
        commit: this.render.bind(this),
    };

    constructor(editor: JWEditor, options: JWPluginConfig = {}) {
        super(editor, options);
        this.editable = document.createElement('jw-editable');
        this.editable.setAttribute('contenteditable', 'true');

        // TODO: create structure to allow the plugin to add DOM into the editor (left, right, top, bottom, center)
        this.editor.el.appendChild(this.editable);

        // Init the rendering in HTML element
        this.renderer = new DomRenderer(editor);

        // Init the event manager now that the cloned editable is in the DOM.
        this.eventManager = new EventManager(this);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Render the vDocument
     *
     */
    render(): void {
        const root = this.editor.vDocument;
        this.renderer.render(this.vDocumentMap, root, this.editable);

        this._renderSelection();
    }
    /**
     * Render the given VSelection as a DOM selection in the given target.
     *
     * @param selection
     * @param target
     */
    _renderSelection(): void {
        const selection = this.editor.vDocument.selection;
        const [anchorNode, anchorOffset] = this._getDomLocation(selection.anchor);
        const [focusNode, focusOffset] = this._getDomLocation(selection.focus);
        const domRange = this.editable.ownerDocument.createRange();
        if (selection.direction === Direction.FORWARD) {
            domRange.setStart(anchorNode, anchorOffset);
            domRange.collapse(true);
        } else {
            domRange.setEnd(anchorNode, anchorOffset);
            domRange.collapse(false);
        }
        const domSelection = document.getSelection();
        domSelection.removeAllRanges();
        domSelection.addRange(domRange);
        domSelection.extend(focusNode, focusOffset);
    }
    /**
     * Return the location in the DOM corresponding to the location in the
     * VDocument of the given VNode. The location in the DOM is expressed as a
     * tuple containing a reference Node and a relative position with respect to
     * the reference Node.
     *
     * @param node
     */
    _getDomLocation(node: VNode): [Node, number] {
        let reference = node.previousSibling();
        let position = RelativePosition.AFTER;
        if (reference) {
            reference = reference.lastLeaf();
        } else {
            reference = node.nextSibling();
            position = RelativePosition.BEFORE;
        }
        if (reference) {
            reference = reference.firstLeaf();
        } else {
            reference = node.parent;
            position = RelativePosition.INSIDE;
        }
        // The location is a tuple [reference, offset] implemented by an array.
        const location = this.vDocumentMap.toDomLocation(reference);
        if (position === RelativePosition.AFTER) {
            // Increment the offset to be positioned after the reference node.
            location[1] += 1;
        }
        return location;
    }
}
