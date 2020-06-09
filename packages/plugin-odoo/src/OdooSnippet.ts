import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { OdooStructureXmlDomParser } from './OdooStructureXmlDomParser';
import { OdooImageDomObjectRenderer } from './OdooImageDomObjectRenderer';

export class OdooSnippet<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer & Keymap> = {
        parsers: [OdooStructureXmlDomParser],
        renderers: [OdooImageDomObjectRenderer],
        shortcuts: [],
    };
}
