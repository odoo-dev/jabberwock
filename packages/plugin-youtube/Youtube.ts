import { JWPlugin } from '../core/src/JWPlugin';
import { YoutubeDomParser } from './YoutubeDomParser';
import { YoutubeDomRenderer } from './YoutubeDomRenderer';

export class Youtube extends JWPlugin {
    readonly parsers = [YoutubeDomParser];
    readonly renderers = [YoutubeDomRenderer];
}
