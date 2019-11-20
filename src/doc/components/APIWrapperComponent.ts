import * as owl from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import { MainSidebarAPI } from './MainSidebarAPI';

import * as markdownIt from 'markdown-it';
import { useState } from 'owl-framework/src/hooks';

// import classSrc from './../assets/img/tmp/class.png';
import { APIElement } from './APIElement';
import { APIIcon } from './APIIcon';
import { Link } from 'owl-framework/src/router/link';
import { SignatureType } from './SignatureType';

const md = markdownIt({
    html: false, // Enable HTML tags in source
    xhtmlOut: false, // Use '/' to close single tags (<br />).
    // This is only for full CommonMark compatibility.
    breaks: false, // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-', // CSS language prefix for fenced blocks. Can be
    // useful for external highlighters.
    linkify: false, // Autoconvert URL-like text to links

    // Enable some language-neutral replacement + quotes beautification
    typographer: false,

    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '“”‘’',

    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externally.
    // If result starts with <pre... internal wrapper is skipped.
    highlight: function(/*str, lang*/) {
        return '';
    },
});

export const KIND_MAP = {
    '0': 'global',
    '1': 'externalModule',
    '2': 'module',
    '4': 'enum',
    '16': 'enumMember',
    '32': 'variable',
    '64': 'function',
    '128': 'class',
    '256': 'interface',
    '512': 'constructor',
    '1024': 'property',
    '2048': 'method',
    '4096': 'callSignature',
    '8192': 'indexSignature',
    '16384': 'constructorSignature',
    '32768': 'parameter',
    '65536': 'typeLiteral',
    '131072': 'typeParameter',
    '262144': 'accessor',
    '524288': 'getSignature',
    '1048576': 'setSignature',
    '2097152': 'objectLiteral',
    '4194304': 'typeAlias',
    '8388608': 'Event',
};

const FLAG_MAP = {
    '0': 'none',
    '1': 'private',
    '2': 'protected',
    '4': 'public',
    '8': 'static',
    '16': 'exported',
    '32': 'exportAssignment',
    '64': 'external',
    '128': 'optional',
    '256': 'defaultValue',
    '512': 'rest',
    '1024': 'constructorProperty',
    '2048': 'abstract',
    '4096': 'const',
    '8192': 'let',
};

interface APIWrapperComponentStatePackages {
    [key: string]: {
        githubLink: string;
    };
}

interface APIWrapperComponentState {
    api:
        | {
              packages: APIWrapperComponentStatePackages;
              tree: APITree;
          }
        | undefined;
    visibleItems: any;
    apiContent: any;
    currentPath: string[];
}

interface APITree {
    name: string;
    isFold: boolean;
    children: APITree[] | any;
}

interface APIWrapperComponentProps {
    id: number;
}

export class APIWrapperComponent extends owl.Component<Env, APIWrapperComponentProps> {
    static components = { MainSidebarAPI, APIElement, APIIcon, Link, SignatureType };
    KIND_MAP = KIND_MAP;
    FLAG_MAP = FLAG_MAP;
    md = md;
    state: APIWrapperComponentState;
    objects = {};

    constructor(parent: owl.Component<Env, any>, props: APIWrapperComponentProps) {
        super(parent, props);
        this.state = useState({
            api: undefined,
            apiContent: undefined,
            visibleItems: {},
            currentPath: [],
        });
        this.getGithubUrl = this.getGithubUrl.bind(this);
    }

    async willStart(): Promise<any> {
        const response = await fetch('/api.json');
        this.state.api = await response.json();
        this.objects = {};
        this.getObjectPaths(this.state.api.tree);
        this.selectObject(this.props.id);
    }

    async willUpdateProps(nextProps: APIWrapperComponentProps): Promise<void> {
        this.selectObject(nextProps.id);
    }

    getObjectPaths(objects: any, path = []): void {
        objects.forEach(object => {
            if (object.isFolder || object.sources) {
                this.getObjectPaths(object.children, [...path, object.name]);
            } else {
                this.objects[object.id] = path;
            }
        });
    }

    async selectObject(objectID?: number): Promise<void> {
        if (objectID) {
            await this.loadContent(objectID);
        }
    }

    getMember(id: number): any {
        return this.state.apiContent.children.find(x => x.id === id);
    }

    async loadContent(id: number): Promise<void> {
        const path = `/api/${id}.json`;
        const response = await fetch(path);
        const json = await response.json();
        if (json.kind === 1) {
            return;
        }
        this.state.currentPath = [...this.objects[json.id], json.id];
        this.state.apiContent = json;
    }

    getGithubUrl(item: any): string {
        const source = item.sources[0];
        return (
            this.state.api.packages[source.packageName].githubLink +
            source.fileName +
            '#L' +
            source.line
        );
    }
}
