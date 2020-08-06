import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultHtmlDomRenderer } from './DefaultHtmlDomRenderer';
import { DefaultHtmlDomModifierRenderer } from './DefaultHtmlDomModifierRenderer';

export class HtmlDomRenderingEngine extends RenderingEngine<Node[]> {
    static id = 'dom/html';
    static readonly defaultRenderer = DefaultHtmlDomRenderer;
    static readonly defaultModifierRenderer = DefaultHtmlDomModifierRenderer;
}
