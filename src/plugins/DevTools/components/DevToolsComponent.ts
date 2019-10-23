import { ActionsComponent } from './ActionsComponent';
import { InspectorComponent } from './InspectorComponent';
import { OwlUIComponent } from '../../../ui/OwlUIComponent';
import { useState } from 'owl-framework/src/hooks';

////////////////////////////// todo: use API ///////////////////////////////////

interface DevToolsState {
    closed: boolean; // Are the devtools open?
    height: number; // In px
    currentTab: string; // Name of the current tab
    actions: Action[]; // Stack of all actions performed since init
}

export class DevToolsComponent extends OwlUIComponent<{}> {
    static components = { ActionsComponent, InspectorComponent };
    static template = 'devtools';
    state: DevToolsState = useState({
        closed: true,
        currentTab: 'inspector',
        height: 300,
        actions: [], // Stack of all actions performed since init
    });
    handlers: PluginHandlers = {
        intents: {
            '*': 'refresh',
            'render': 'refresh',
        },
    };
    commands = {
        refresh: this.refresh.bind(this),
    };
    localStorage = ['closed', 'currentTab', 'height'];
    // For resizing/opening (see toggleClosed)
    _heightOnLastMousedown: number;

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Open the tab with the given `tabName`
     *
     * @param {string} tabName
     */
    openTab(tabName: string): void {
        this.state.currentTab = tabName;
    }
    /**
     * On render the `vDocument`, rerender and select the range nodes.
     */
    refresh(intent?: Intent): void {
        if (intent) {
            this.state.actions.push(intent);
        }
        this.render();
    }
    /**
     * Drag the DevTools to resize them
     *
     * @param {MouseEvent} event
     */
    startResize(event: MouseEvent): void {
        this._heightOnLastMousedown = this.state.height;
        if (this.state.closed) {
            return; // Do not resize if the DevTools are closed
        }
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
