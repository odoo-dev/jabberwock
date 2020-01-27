import { JWPlugin } from '../core/src/JWPlugin';
import { ImageDomParser } from './ImageDomParser';
import { ImageDomRenderer } from './ImageDomRenderer';

export class Image extends JWPlugin {
    readonly parsers = [ImageDomParser];
    readonly renderers = [ImageDomRenderer];
}
