import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { HtmlTextParsingEngine } from './HtmlTextParsingEngine';
import { HtmlDomParsingEngine } from './HtmlDomParsingEngine';
import { Xml } from '../../plugin-xml/src/Xml';
import { HtmlDomRenderingEngine } from './HtmlDomRenderingEngine';
import { HtmlHtmlDomRenderer } from './HtmlNodeDomRenderer';
import { DomObjectRenderer } from '../../plugin-renderer-dom-object/src/DomObjectRenderer';

export class Html<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, DomObjectRenderer, Xml];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsingEngines: [HtmlDomParsingEngine, HtmlTextParsingEngine],
        renderingEngines: [HtmlDomRenderingEngine],
        renderers: [HtmlHtmlDomRenderer],
    };
}
