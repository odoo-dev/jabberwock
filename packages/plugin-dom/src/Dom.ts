import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DomParsingEngine } from './DomParsingEngine';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { HtmlParsingEngine } from './../HtmlParsingEngine';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomRenderingEngine } from './DomRenderingEngine';

export class Dom<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, Renderer];
    readonly loadables: Loadables<Parser & Renderer & Layout> = {
        parsingEngines: [DomParsingEngine, HtmlParsingEngine],
        renderingEngines: [DomRenderingEngine],
        components: [],
    };
}
