import { CommandsComponent } from './CommandsComponent';
import { InspectorComponent } from './InspectorComponent';
import { ShortcutsComponent } from './ShortcutsComponent';
import { OwlComponent } from '../../../plugin-owl/src/ui/OwlComponent';
import { CommandIdentifier, CommandParams } from '../../../core/src/Dispatcher';
import { nodeName } from '../../../utils/src/utils';
import { hooks } from '@odoo/owl';

////////////////////////////// todo: use API ///////////////////////////////////

interface DevToolsState {
    closed: boolean; // Are the devtools open?
    height: number; // In px
    currentTab: string; // Name of the current tab
    commands: Array<[CommandIdentifier, CommandParams]>;
}

export class DevToolsComponent<T = {}> extends OwlComponent<T> {
    static components = {
        CommandsComponent: CommandsComponent,
        InspectorComponent,
        ShortcutsComponent,
    };
    static template = 'devtools';
    inspectorRef = hooks.useRef('inspector');

    state: DevToolsState = {
        closed: true,
        currentTab: 'inspector',
        height: 300,
        commands: [], // Stack of all commands executed since init.
    };
    localStorage = ['closed', 'currentTab', 'height'];
    // For resizing/opening (see toggleClosed)
    _heightOnLastMousedown: number;

    async willStart(): Promise<void> {
        this.env.editor.dispatcher.registerCommandHook('*', this.refresh.bind(this));
        return super.willStart();
    }

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
     * Bind mouse handler to allow the selection of the node in the devtools inspector.
     * When the mouse will move, we add a class to highlight the targeted node (linked to VNode).
     * Will be unbind when the user click inside the dom.
     *
     * @param ev
     */
    inpectDom(): void {
        this.state.currentTab = 'inspector';
        (this.inspectorRef.comp as InspectorComponent).inpectDom();
    }
    /**
     * Refresh this component with respect to the recent dispatching of the
     * given command with the given arguments.
     */
    refresh(params: CommandParams, id: CommandIdentifier): void {
        this.state.commands.push([id, params]);
        this.render();
    }
    /**
     * Drag the DevTools to resize them
     *
     * @param {MouseEvent} event
     */
    startResize(event: MouseEvent | TouchEvent): void {
        event.preventDefault();
        this._heightOnLastMousedown = this.state.height;
        if (this.state.closed) {
            return; // Do not resize if the DevTools are closed
        }
        const startY: number =
            event instanceof MouseEvent ? event.pageY : event.targetTouches[0].pageY; // Y position of the mousedown

        /**
         * Perform the resizing on every mouse mouvement
         *
         * @param ev
         */
        const doResize = (ev: MouseEvent | TouchEvent): void => {
            const currentY: number =
                ev instanceof MouseEvent ? ev.pageY : ev.targetTouches[0].pageY;
            const offset: number = startY - currentY;
            this.state.height = this._heightOnLastMousedown + offset;
        };
        /**
         * Stop resizing on mouse up
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
    /**
     * Toggle the `closed` state of the DevTools (only on a simple click: not
     * if some resizing occurred between mousedown and mouseup)
     */
    toggleClosed(event: MouseEvent): void {
        const didJustResize = this._heightOnLastMousedown !== this.state.height;
        const isOnButton = nodeName(event.target as HTMLElement) === 'DEVTOOLS-BUTTON';
        if (!didJustResize && !(isOnButton && !this.state.closed)) {
            this.state.closed = !this.state.closed;
        }
    }
}
