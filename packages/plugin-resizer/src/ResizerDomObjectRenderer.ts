import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { ResizerNode } from './ResizerNode';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';

export class ResizerDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ResizerNode;

    domEngine: DomLayoutEngine;
    targetToResize: HTMLElement;

    async render(node: ResizerNode): Promise<DomObject> {
        const objectResizer: DomObject = {
            tag: 'JW-RESIZER',
        };
        // This should become obsolete when we refactor the resiser (see _initTargetToResize() comment).
        this.domEngine = this.engine.editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

        objectResizer.attach = (el: HTMLElement): void => {
            el.addEventListener('mousedown', this.startResize.bind(this));
            el.addEventListener('touchstart', this.startResize.bind(this));
        };
        return objectResizer;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------
    /**
     * Drag the Resizer to change the editor size.
     *
     * @param {MouseEvent} event
     */
    startResize(event: MouseEvent | TouchEvent): void {
        event.preventDefault();
        this._initTargetToResize();
        if (!this.targetToResize) return;

        const startHeight = this.targetToResize.clientHeight;
        const startY: number =
            event instanceof MouseEvent ? event.pageY : event.targetTouches[0].pageY; // Y position of the mousedown

        /**
         * Perform the resizing on every mouse mouvement.
         *
         * @param e
         */
        const doResize = (e: MouseEvent | TouchEvent): void => {
            const currentY: number = e instanceof MouseEvent ? e.pageY : e.targetTouches[0].pageY;
            const offset: number = currentY - startY;
            this._resizeTargetHeight(startHeight + offset);
        };
        /**
         * Stop resizing on mouse up.
         */
        const stopResize = (): void => {
            window.removeEventListener('mousemove', doResize, false);
            window.removeEventListener('mouseup', stopResize, false);
            window.removeEventListener('touchmove', doResize, false);
            window.removeEventListener('touchend', stopResize, false);
        };

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
        window.addEventListener('touchmove', doResize);
        window.addEventListener('touchend', stopResize);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------
    /**
     * Discover the HTMLElement to resize and set it as a class property.
     */
    _initTargetToResize(): void {
        // This way of HTMLElement discovery is far from ideal.
        // The Resizer should never be aware of the HTMLElement.
        //
        // TODO: We should change this to use a shared variable whose value would be listen to by another plugin.
        // The other plugin can then use the shared height value to change the height of his children element.
        //
        // Result: the resizer plugin will become agnostic of the HTMLElement afected by the resize.
        // Problem: We don't yet have a way to do this properly.
        if (this.targetToResize) return;

        const mainZone = this.domEngine.root.descendants(
            node => node instanceof ZoneNode && node.managedZones.includes('main'),
        )[0];
        this.targetToResize = (this.domEngine.getDomNodes(
            mainZone,
        )[0] as HTMLElement)?.parentElement;

        // Force the overflow on the targetElement.
        // Necesary to make the resizer works out of the box.
        this.targetToResize.style.overflow = 'auto';
    }
    /**
     * Change the height of the target HTMLElement.
     *
     * @param {number} height
     */
    _resizeTargetHeight(height: number): void {
        height = Math.max(height, 50); // todo : implement a way to force the min-height with resizer parameters ?
        if (this.targetToResize) this.targetToResize.style.height = height + 'px';
    }
}
