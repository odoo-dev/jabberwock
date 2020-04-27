import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { YoutubeXmlDomParser } from './YoutubeXmlDomParser';
import { YoutubeHtmlDomRenderer } from './YoutubeHtmlDomRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class Youtube<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [YoutubeXmlDomParser],
        renderers: [YoutubeHtmlDomRenderer],
    };
}
