import { ActionsComponent } from './ActionsComponent';
import { InspectorComponent } from './InspectorComponent';
import { OwlUIComponent } from '../../../ui/OwlUIComponent';
import { useState, useRef } from 'owl-framework/src/hooks';

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
    actionComponentRef = useRef('ActionsComponent');
    inspectorComponentRef = useRef('InspectorComponent');
    state: DevToolsState = useState({
        closed: true,
        currentTab: 'inspector',
        height: 300,
        actions: [], // Stack of all actions performed since init
    });
    handlers: PluginHandlers = {
        intents: {
            '*': 'addAction',
            'render': 'onRender',
        },
    };
    commands = {
        addAction: this.addAction.bind(this),
        onRender: this.onRender.bind(this),
    };
    localStorage = ['closed', 'currentTab', 'height'];
    // For resizing/opening (see toggleClosed)
    _heightOnLastMousedown: number;

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add an action to the stack
     *
     * @param {Action} action
     */
    addAction(action: Action): void {
        if (this.actionComponentRef.comp) {
            (this.actionComponentRef.comp as ActionsComponent).addAction(action);
        }
    }
    /**
     * On render the `vDocument`, rerender and select the range nodes.
     */
    onRender(): void {
        this.render();
        if (this.inspectorComponentRef.comp) {
            const range = this.env.editor.vDocument.range;
            const inspectorComponent = this.inspectorComponentRef.comp as InspectorComponent;
            inspectorComponent._selectNode(range._start);
            // In order for owl-framework to unfold the parents of start *and*
            // of end, we need to select both, with a tick in between.
            setTimeout(() => inspectorComponent._selectNode(range._end), 0);
        }
    }
    /**
     * Open the tab with the given `tabName`
     *
     * @param {string} tabName
     */
    openTab(tabName: string): void {
        this.state.currentTab = tabName;
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
