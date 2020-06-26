import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Stylesheet } from '../../plugin-stylesheet/src/Stylesheet';
import { Html } from '../../plugin-html/src/Html';
import { TextMailRendereringEngine } from './TextMailRendereringEngine';
import { MailObjectRenderingEngine } from './MailObjectRenderingEngine';
import { Shadow } from '../../plugin-shadow/src/Shadow';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { MarkerMailObjectRenderer } from './MarkerMailObjectRenderer';

export class Mail<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Html, Stylesheet, Shadow, DomLayout];
    readonly loadables: Loadables<Renderer> = {
        renderingEngines: [TextMailRendereringEngine, MailObjectRenderingEngine],
        renderers: [MarkerMailObjectRenderer],
    };
}
