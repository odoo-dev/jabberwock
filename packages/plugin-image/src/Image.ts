import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ImageXmlDomParser } from './ImageXmlDomParser';
import { ImageDomObjectRenderer } from './ImageDomObjectRenderer';
import { ImageMailObjectRenderer } from './ImageMailObjectRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class Image<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [ImageXmlDomParser],
        renderers: [ImageDomObjectRenderer, ImageMailObjectRenderer],
    };
}
