import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { OdooVideoXmlDomParser } from './OdooVideoXmlDomParser';
import { OdooVideoHtmlDomRenderer } from './OdooVideoHtmlDomRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class OdooVideo<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [OdooVideoXmlDomParser],
        renderers: [OdooVideoHtmlDomRenderer],
    };
}
