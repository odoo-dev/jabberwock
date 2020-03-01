import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { MetadataDomParser } from './MetadataDomParser';
import { MetadataDomRenderer } from './MetaDataDomRenderer';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';

export class Metadata<T extends JWPluginConfig> extends JWPlugin<T> implements Loadables<Parser> {
    readonly loadables = {
        parsers: [MetadataDomParser],
    };
    readonly renderers = [MetadataDomRenderer];
}
