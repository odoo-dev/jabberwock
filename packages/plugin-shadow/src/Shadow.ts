import { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { ShadowHtmlDomParser } from './ShadowHtmlDomParser';
import { ShadowXmlDomParser } from './ShadowXmlDomParser';
import { ShadowHtmlDomRenderer } from './ShadowHtmlDomRenderer';

export class Shadow<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, Renderer];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [ShadowXmlDomParser, ShadowHtmlDomParser],
        renderers: [ShadowHtmlDomRenderer],
    };
}
