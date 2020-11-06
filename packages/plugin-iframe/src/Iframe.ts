import { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { IframeHtmlDomParser } from './IframeHtmlDomParser';
import { IframeXmlDomParser } from './IframeXmlDomParser';
import { IframeContainerDomObjectRenderer } from './IframeContainerDomObjectRenderer';
import { IframeDomObjectRenderer } from './IframeDomObjectRenderer';

export class Iframe<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, Renderer];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [IframeXmlDomParser, IframeHtmlDomParser],
        renderers: [IframeContainerDomObjectRenderer, IframeDomObjectRenderer],
    };
}
