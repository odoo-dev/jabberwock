import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Xml } from '../../plugin-xml/src/Xml';
import { DomObjectRenderingEngine } from './DomObjectRenderingEngine';

export class DomObjectRenderer<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, Renderer, Xml];
    readonly loadables: Loadables<Parser & Renderer> = {
        renderingEngines: [DomObjectRenderingEngine],
    };
}
