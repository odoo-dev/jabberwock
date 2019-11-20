import { Link } from 'owl-framework/src/router/link';
import * as owl from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import { useState } from 'owl-framework/src/hooks';
import { APIIcon } from './APIIcon';
import { KIND_MAP } from './APIWrapperComponent';

interface MainSidebarAPIItem {
    name?: string;
    path?: string;
    children?: MainSidebarAPIItem[];
}

interface MainSidebarAPIProps {
    name?: string;
    path?: string[];
    currentPath: string[];
    children?: MainSidebarAPIItem[];
}

export class MainSidebarAPI extends owl.Component<Env, MainSidebarAPIProps> {
    static components = { MainSidebarAPI, APIIcon, Link };
    KIND_MAP = KIND_MAP;
    state = useState({
        visibleItems: {},
    });

    mounted(): void {
        function eventFire(el, etype): void {
            el = document.querySelector(el);
            if (el.fireEvent) {
                el.fireEvent('on' + etype);
            } else {
                const evObj = document.createEvent('Events');
                evObj.initEvent(etype, true, false);
                el.dispatchEvent(evObj);
            }
        }
        // todo: select the first element properly
        // todo: handle if props is empty
        //eventFire('.main-sidebar-api a', 'click');
    }

    async willStart(): Promise<any> {
        this.checkFolded(this.props);
    }

    checkFolded(props: MainSidebarAPIProps): void {
        props.children.forEach(children => {
            if (props.currentPath.join('/').startsWith([...props.path, children.name].join('/'))) {
                this.state.visibleItems[children.name] = true;
            }
        });
    }

    async willUpdateProps(nextProps: MainSidebarAPIProps): Promise<void> {
        this.checkFolded(nextProps);
    }

    onClickSelectObject(object: MainSidebarAPIItem): void {
        // this.trigger('select-object', object);
    }

    toggleVisible(item: any): void {
        console.log('togglevisible item', item);
        console.log('this.state.visibleItems[item.name]:', this.state.visibleItems[item.name]);
        this.state.visibleItems[item.name] = !this.state.visibleItems[item.name];
    }
}
