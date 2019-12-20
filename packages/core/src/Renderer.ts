import { VDocumentMap } from './VDocumentMap';
import { VDocument } from './VDocument';
import { VNode } from './VNodes/VNode';
import { VRange } from './VRange';
import { RelativePosition } from '../../utils/src/range';
import { RenderPredicate, RenderingContextHook, RenderingEngineRecord } from './JWPlugin';
import { VElement } from './VNodes/VElement';
import { RenderingEngineName, RenderingEngine } from './RenderingEngine';

export interface RenderingContext {
    currentVNode?: VNode; // Current VNode rendered at this step.
    parentNode?: Node | DocumentFragment; // Node to render the VNode into.
    renderingEngine: {
        // Rendering engine to use for rendering
        name: RenderingEngineName;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        engine: RenderingEngine<any>;
    };
}

export class Renderer {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _renderingEngines: RenderingEngineRecord = {};
    _renderPredicates: Set<RenderPredicate> = new Set();
    _renderingContextHooks: Set<RenderingContextHook> = new Set();

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add rendering engines.
     *
     * @param renderingEngines
     */
    addRenderingEngines(renderingEngines: RenderingEngineRecord): void {
        Object.keys(renderingEngines).forEach(name => {
            this._renderingEngines[name] = renderingEngines[name];
        });
    }
    /**
     * Add a method to the ones this Parser uses to find which plugin parses
     * which node.
     *
     * @param renderPredicate
     */
    addRenderPredicate(renderPredicate: RenderPredicate): void {
        this._renderPredicates.add(renderPredicate);
    }
    /**
     * Register a hook on the evaluation of the next rendering context.
     *
     * @see _nextRenderingContext
     * @param renderingContextHook
     */
    registerRenderingContextHook(renderingContextHook: RenderingContextHook): void {
        this._renderingContextHooks.add(renderingContextHook);
    }
    /**
     * Render the contents of a root VNode into a given target element.
     *
     * @param root
     * @param target
     * @param [to] the name of the format to which we want to render
     */
    render(vDocument: VDocument, target: Element, to: RenderingEngineName = 'html'): void {
        // TODO: Make this return-agnostic. The Rendering Engine should be the
        // one to implement this. It then returns whatever it wants to return
        // and some other thing renders for our view. HtmlRenderingEngine
        // returns a DocumentFragment already so we can add it to the target.
        // MarkdownRenderingEngine returns a string. We could simply add it as
        // the target's innerHTML.
        const root = vDocument.root;
        const range = vDocument.range;
        target.innerHTML = ''; // TODO: update instead of recreate
        const fragment: DocumentFragment = document.createDocumentFragment();
        VDocumentMap.clear(); // TODO: update instead of recreate
        VDocumentMap.set(root, fragment);

        const renderingEngine = this._renderingEngines[to];
        if (!renderingEngine) {
            throw new Error('The specified rendering engine could not be found.');
        }

        if (root.hasChildren()) {
            let context: RenderingContext = {
                currentVNode: root.firstChild(),
                parentNode: fragment,
                renderingEngine: {
                    name: to,
                    engine: renderingEngine,
                },
            };
            do {
                context = this._renderVNode(context);
            } while ((context = this._nextRenderingContext(context)));
        }
        target.appendChild(fragment);

        this._renderRange(range, target);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _renderFromPlugins(context: RenderingContext): RenderingContext {
        for (const renderPredicate of this._renderPredicates) {
            const renderer = renderPredicate(context.currentVNode);
            if (renderer) {
                return renderer(context);
            }
        }
        if (context.currentVNode instanceof VElement) {
            return VElement.render(context);
        }
    }
    /**
     * Return the next rendering context, based on the given context. This
     * includes the next VNode to render and the next parent element to render
     * it into.
     *
     * @param context
     */
    _nextRenderingContext(context: RenderingContext): RenderingContext {
        for (const renderingContextHook of this._renderingContextHooks) {
            const foundContext = renderingContextHook({ ...context });
            if (foundContext) {
                context = foundContext;
            }
        }

        const vNode = context.currentVNode;
        if (vNode.hasChildren()) {
            // Render the first child with the current node as parent.
            context.currentVNode = context.currentVNode.children[0];
            context.parentNode = VDocumentMap.toDom(vNode) as Element;
        } else if (vNode.nextSibling()) {
            // Render the siblings of the current node with the same parent.
            context.currentVNode = context.currentVNode.nextSibling();
            context.parentNode = VDocumentMap.toDom(vNode.parent) as Element;
        } else {
            // Render the next ancestor sibling in the ancestor tree.
            let ancestor = vNode.parent;
            // Climb up the ancestor tree to the first parent having a sibling.
            while (ancestor && !ancestor.nextSibling()) {
                ancestor = ancestor.parent;
            }
            if (ancestor) {
                // At this point, the found ancestor has a sibling.
                context.currentVNode = ancestor.nextSibling();
                context.parentNode = VDocumentMap.toDom(ancestor.parent) as Element;
            } else {
                // If no next ancestor having a sibling could be found then the
                // tree has been fully rendered.
                return;
            }
        }
        if (!context.parentNode) return;
        return context;
    }
    /**
     * Render the given VRange as a selection in the DOM in the given target.
     *
     * @param range
     * @param target
     */
    _renderRange(range: VRange, target: Element): void {
        const [startContainer, startOffset] = this._getDomLocation(range.anchor);
        const [endContainer, endOffset] = this._getDomLocation(range.focus);
        if (startContainer && startOffset && endContainer && endOffset) {
            const domRange: Range = target.ownerDocument.createRange();
            domRange.setStart(startContainer, startOffset);
            domRange.collapse(true);
            const selection = document.getSelection();
            selection.removeAllRanges();
            selection.addRange(domRange);
            selection.extend(endContainer, endOffset);
        }
    }
    /**
     * Return the location in the DOM corresponding to the location in the
     * VDocument of the given range VNode. The location in the DOM is expressed
     * as a tuple containing a reference Node and a relative position with
     * respect to the reference Node.
     *
     * @param rangeNode
     */
    _getDomLocation(rangeNode: VNode): [Node, number] {
        let reference = rangeNode.previousSibling();
        let position = RelativePosition.AFTER;
        if (reference) {
            reference = reference.lastLeaf();
        } else {
            reference = rangeNode.nextSibling();
            position = RelativePosition.BEFORE;
        }
        if (reference) {
            reference = reference.firstLeaf();
        } else {
            reference = rangeNode.parent;
            position = RelativePosition.INSIDE;
        }
        // The location is a tuple [reference, offset] implemented by an array.
        const location = VDocumentMap.toDomLocation(reference);
        if (position === RelativePosition.AFTER) {
            // Increment the offset to be positioned after the reference node.
            location[1] += 1;
        }
        return location;
    }
    /**
     * Render a VNode and trigger the rendering of the next one, recursively.
     *
     * @param context
     */
    _renderVNode(context: RenderingContext): RenderingContext {
        return this._renderFromPlugins({ ...context });
    }
}
