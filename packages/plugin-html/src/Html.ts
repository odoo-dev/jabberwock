import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { HtmlTextParsingEngine } from './HtmlTextParsingEngine';
import { HtmlDomParsingEngine } from './HtmlDomParsingEngine';
import { HtmlDomRenderingEngine } from './HtmlDomRenderingEngine';
import { Xml } from '../../plugin-xml/src/Xml';

export class Html<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, Renderer, Xml];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsingEngines: [HtmlDomParsingEngine, HtmlTextParsingEngine],
        renderingEngines: [HtmlDomRenderingEngine],
    };
}
