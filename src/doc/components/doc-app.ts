import * as owl from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import { Link } from 'owl-framework/src/router/link';
import { RouteComponent } from 'owl-framework/src/router/route_component';

import { ArticleWrapperComponent } from './ArticleWrapperComponent';
import { APIWrapperComponent } from './APIWrapperComponent';

import logoSrc from './../assets/img/logo-src.png';
import githubSrc from './../assets/img/github.png';

import '../assets/css/doc.scss';
import { Search } from './Search';
import { store } from './store';

interface FileTreeItem {
    name: string;
    path: string;
    children?: FileTreeItem[];
}
export class DocApp extends owl.Component<Env, {}> {
    static components = {
        ArticleWrapperComponent,
        APIWrapperComponent,
        Search,
        Link,
        RouteComponent,
    };
    fileTree: FileTreeItem[];
    asset = {
        logoSrc,
        githubSrc,
    };

    async willStart(): Promise<void> {
        const response = await fetch('/file-tree.json');
        this.fileTree = (await response.json()) as FileTreeItem[];
        store.dispatch('loadTree', this.fileTree);
        //this.onClickAPI();
    }
    onClickHome(): void {
        (window as any).location = '/';
    }
    onClickGithub(): void {
        (window as any).location = 'http://github.com/odoo/jabberwock';
    }
}
