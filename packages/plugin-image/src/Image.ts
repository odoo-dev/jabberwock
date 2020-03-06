import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ImageDomParser } from './ImageDomParser';
import { ImageDomRenderer } from './ImageDomRenderer';

export class Image<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly parsers = [ImageDomParser];
    readonly renderers = [ImageDomRenderer];
}
