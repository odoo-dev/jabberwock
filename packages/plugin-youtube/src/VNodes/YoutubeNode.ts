import { VNode } from '../../../core/src/VNodes/VNode';

interface YoutubeOptions {
    width?: string;
    height?: string;
    frameborder?: string;
    allow?: string;
    allowfullscreen?: boolean;
}

export class YoutubeNode extends VNode {
    htmlTag = 'IFRAME';
    url: string;
    youtubeOptions: YoutubeOptions;
    constructor(url: string, youtubeOptions: YoutubeOptions = {}) {
        super('youtube');
        this.url = url;
        this.youtubeOptions = youtubeOptions;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    static parse(node: Node): VNode | VNode[] | null {
        if (node.nodeName === 'IFRAME') {
            const element = node as Element;
            const src = element.getAttribute('src');
            if (src && src.includes('youtu')) {
                return new YoutubeNode(src, {
                    width: element.getAttribute('width'),
                    height: element.getAttribute('height'),
                    frameborder: element.getAttribute('frameborder'),
                    allow: element.getAttribute('allow'),
                    allowfullscreen: element.getAttribute('allowfullscreen') !== null,
                });
            }
        }
        return null;
    }
    /**
     * Render the VNode to the given format.
     *
     * @param [to] the name of the format to which we want to render (default:
     * html)
     */
    render<T>(to = 'html'): T {
        const t = this.renderingEngines[to].render(this) as T;
        if (to === 'html' && t instanceof DocumentFragment) {
            const iframe = t.firstChild as Element;
            iframe.setAttribute('src', this.url);
            Object.keys(this.youtubeOptions).forEach(key => {
                iframe.setAttribute(key, this.youtubeOptions[key]);
            });
        }
        return t;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the VNode is atomic (ie. it may not have children).
     *
     * @override
     */
    get atomic(): boolean {
        return true;
    }
}
