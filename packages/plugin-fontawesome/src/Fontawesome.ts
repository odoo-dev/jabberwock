import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { FontawesomeDomParser } from './FontawesomeDomParser';
import { FontawesomeDomRenderer } from './FontawesomeDomRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class Fontawesome<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [FontawesomeDomParser],
        renderers: [FontawesomeDomRenderer],
    };
}
