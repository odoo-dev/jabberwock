import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { MetadataDomParser } from './MetadataDomParser';
import { MetadataDomRenderer } from './MetaDataDomRenderer';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';
import { Renderer } from '../plugin-renderer/src/Renderer';

export class Metadata<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [MetadataDomParser],
        renderers: [MetadataDomRenderer],
    };
}
