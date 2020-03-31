import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Loadables } from '../../core/src/JWEditor';
import { DialogZoneHtmlDomRenderer } from './ui/DialogZoneHtmlDomRenderer';
import { DialogZoneXmlDomParser } from './ui/DialogZoneXmlDomParser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';

export class Dialog<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, Renderer, DomLayout];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [DialogZoneXmlDomParser],
        renderers: [DialogZoneHtmlDomRenderer],
    };
}
