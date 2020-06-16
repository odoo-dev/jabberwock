import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { FontAwesomeXmlDomParser } from './FontAwesomeXmlDomParser';
import { FontAwesomeDomObjectRenderer } from './FontAwesomeDomObjectRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class FontAwesome<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [FontAwesomeXmlDomParser],
        renderers: [FontAwesomeDomObjectRenderer],
    };
}
