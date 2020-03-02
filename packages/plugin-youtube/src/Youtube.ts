import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { YoutubeDomParser } from './YoutubeDomParser';
import { YoutubeDomRenderer } from './YoutubeDomRenderer';
import { Parser } from '../plugin-parser/src/Parser';
import { Loadables } from '../core/src/JWEditor';
import { Renderer } from '../plugin-renderer/src/Renderer';

export class Youtube<T extends JWPluginConfig> extends JWPlugin<T>
    implements Loadables<Parser & Renderer> {
    readonly loadables = {
        parsers: [YoutubeDomParser],
        renderers: [YoutubeDomRenderer],
    };
}
