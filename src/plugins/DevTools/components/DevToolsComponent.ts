import { ActionsComponent } from './ActionsComponent';
import { Component } from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import { InspectorComponent } from './InspectorComponent';

////////////////////////////// todo: use API ///////////////////////////////////

interface DevToolsState {
    closed: boolean; // Are the devtools open?
    height: number; // In px
    openTab: 'inspector' | 'actions';
}

export class DevToolsComponent extends Component<Env, {}, DevToolsState> {
    static components = { ActionsComponent, InspectorComponent };
    state: DevToolsState = {
        closed: false,
        height: 300,
        openTab: 'inspector',
    };
    static template = 'devtools';
    // For resizing/opening (see toggleClosed)
    _heightOnLastMousedown: number = this.state.height;

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Open the tab with the given `tabName`
     *
     * @param {'inspector' | 'actions'} tabName
     */
    openTab(tabName: 'inspector' | 'actions'): void {
        this.state.openTab = tabName;
    }
    /**
     * Drag the DevTools to resize them
     *
     * @param {MouseEvent} event
     */
    startResize(event: MouseEvent): void {
        if (this.state.closed) {
            return; // Do not resize if the DevTools are closed
        }

        this._heightOnLastMousedown = this.state.height;
        const startY: number = event.pageY; // Y position of the mousedown

        /**
         * Perform the resizing on every mouse mouvement
         *
         * @param mouseMoveEvent
         */
        const doResize = (mouseMoveEvent: MouseEvent): void => {
            const currentY: number = mouseMoveEvent.pageY;
            const offset: number = startY - currentY;
            this.state.height = this._heightOnLastMousedown + offset;
        };
        /**
         * Stop resizing on mouse up
         */
        const stopResize = (): void => {
            window.removeEventListener('mousemove', doResize, false);
            window.removeEventListener('mouseup', stopResize, false);
        };

        window.addEventListener('mousemove', doResize);
        window.addEventListener('mouseup', stopResize);
    }
    /**
     * Toggle the `closed` state of the DevTools (only on a simple click: not
     * if some resizing occurred between mousedown and mouseup)
     */
    toggleClosed(event: MouseEvent): void {
        const didJustResize = this._heightOnLastMousedown !== this.state.height;
        const isOnButton = (event.target as HTMLElement).tagName === 'BUTTON';
        if (!didJustResize && !(isOnButton && !this.state.closed)) {
            this.state.closed = !this.state.closed;
        }
    }
}
