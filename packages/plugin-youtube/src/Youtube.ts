import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { YoutubeDomParser } from './YoutubeDomParser';
import { YoutubeDomRenderer } from './YoutubeDomRenderer';
import { Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';
import { Renderer } from '../plugin-renderer/src/Renderer';

export class Youtube<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [YoutubeDomParser],
        renderers: [YoutubeDomRenderer],
    };
}
