import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { YoutubeDomParser } from './YoutubeDomParser';
import { YoutubeDomRenderer } from './YoutubeDomRenderer';

export class Youtube<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly parsers = [YoutubeDomParser];
    readonly renderers = [YoutubeDomRenderer];
}
