import * as owl from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import { Link } from 'owl-framework/src/router/link';

interface MainSidebarArticleItem {
    name?: string;
    path?: string;
    children?: MainSidebarArticleItem[];
}

interface MainSidebarArticleProps {
    name?: string;
    path?: string;
    children?: MainSidebarArticleItem[];
}

export class MainSidebarArticle extends owl.Component<Env, MainSidebarArticleProps> {
    static components = { MainSidebarArticle, Link };

    mounted(): void {
        // todo: handle if props is empty
        console.log('this.props:', this.props);
        this.trigger('select-article', this.props.children[0]);
    }

    willUpdateProps(nextProps: MainSidebarArticleProps): any {
        console.log('this.props:', this.props);
        console.log('nextProps:', nextProps);
    }
}
