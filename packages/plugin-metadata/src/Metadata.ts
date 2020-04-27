import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { MetadataXmlDomParser } from './MetadataXmlDomParser';
import { MetadataHtmlDomRenderer } from './MetaDataHtmlDomRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class Metadata<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [MetadataXmlDomParser],
        renderers: [MetadataHtmlDomRenderer],
    };
}
