import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ImageDomParser } from './ImageDomParser';
import { ImageDomRenderer } from './ImageDomRenderer';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';
import { Renderer } from '../plugin-renderer/src/Renderer';

export class Image<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [ImageDomParser],
        renderers: [ImageDomRenderer],
    };
}
