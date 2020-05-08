import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { InputXmlDomParser } from './InputXmlDomParser';
import { InputHtmlDomRenderer } from './InputHtmlDomRenderer';

export class Input<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [InputXmlDomParser],
        renderers: [InputHtmlDomRenderer],
    };
}
