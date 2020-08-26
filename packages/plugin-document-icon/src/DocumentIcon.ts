import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { DocumentIconXmlDomParser } from './DocumentIconXmlDomParser';
import { DocumentIconDomObjectRenderer } from './DocumentIconDomObjectRenderer';

export class DocumentIcon<T extends JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [DocumentIconXmlDomParser],
        renderers: [DocumentIconDomObjectRenderer],
    };
}
