import * as owl from 'owl-framework';

import docTemplates from './doc-templates.xml';
import { DocApp } from '../src/doc/components/doc-app';
import { APIWrapperComponent } from '../src/doc/components/APIWrapperComponent';
import { ArticleWrapperComponent } from '../src/doc/components/ArticleWrapperComponent';

export const ROUTES = [
    { name: 'LANDING', path: '/', component: ArticleWrapperComponent },
    { name: 'DOC_PAGE', path: '/doc/{{path}}', component: ArticleWrapperComponent },
    { name: 'API_ITEM', path: '/api/{{id}}', component: APIWrapperComponent },
    { name: 'API', path: '/api', component: APIWrapperComponent },
];

//------------------------------------------------------------------------------
// Application initialization
//------------------------------------------------------------------------------
async function start(): Promise<void> {
    DocApp.env = {
        qweb: new owl.QWeb({ templates: docTemplates }),
        router: undefined,
    };
    const docApp = new DocApp();

    DocApp.env.router = new owl.router.Router(DocApp.env, ROUTES, { mode: 'hash' });
    await DocApp.env.router.start();
    const mainElement = document.createElement('div');
    document.body.appendChild(mainElement);
    await docApp.mount(mainElement);
}

start();
