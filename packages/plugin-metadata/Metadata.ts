import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { MetadataDomParser } from './MetadataDomParser';
import { MetadataDomRenderer } from './MetaDataDomRenderer';

export class Metadata<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly parsers = [MetadataDomParser];
    readonly renderers = [MetadataDomRenderer];
}
