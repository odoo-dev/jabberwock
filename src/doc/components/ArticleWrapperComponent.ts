import * as owl from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import { MainSidebarArticle } from './MainSidebarArticle';
import { useState } from 'owl-framework/src/hooks';
import { store } from './store';

interface ArticleWrapperComponentState {
    article: string;
    tree: any;
}

const LOADING_MESSAGE = 'loading';
const DEFAULT_STATE = {
    article: LOADING_MESSAGE,
    tree: {},
};

interface ArticleWrapperComponentProps {
    path: string;
}

export class ArticleWrapperComponent extends owl.Component<Env, ArticleWrapperComponentProps> {
    static components = { MainSidebarArticle };
    state: ArticleWrapperComponentState;
    pathName: string;
    routePath: string[];

    async willStart(): Promise<void> {
        this.state = useState(DEFAULT_STATE);

        this.updateStateFromStore();
        store.on('update', null, this.updateStateFromStore);
    }
    async willUpdateProps(nextProps: ArticleWrapperComponentProps): Promise<void> {
        console.log('nextProps:', nextProps);
        console.log('this.props:', this.props);
        console.log('this.state:', this.state);
        this.updateStateFromStore(nextProps);
        this.loadContent(['pages', ...this.routePath].join('/'));
    }
    updateStateFromStore(props?: ArticleWrapperComponentProps): void {
        if (!props) {
            props = this.props;
        }
        this.routePath = (props.path || '').split('|');
        this.pathName = this.routePath[0];
        if (store.state.tree) {
            this.state.tree = store.state.tree.find(file => file.name === this.pathName);
        } else {
            this.state.tree = {};
        }
    }
    onSelectedArticle(event: CustomEvent): void {
        console.log('event.detail.path:', event.detail.path);
        // this.state.article = LOADING_MESSAGE;
        // this.loadContent(event.detail.path);
    }
    async loadContent(path: string): Promise<void> {
        this.state.article = LOADING_MESSAGE;
        const response = await fetch(path);
        this.state.article = await response.text();
    }
}
