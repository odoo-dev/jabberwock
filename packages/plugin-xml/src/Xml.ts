import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { XmlDomParsingEngine } from './XmlDomParsingEngine';

export class Xml<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, Renderer];
    readonly loadables: Loadables<Parser> = {
        parsingEngines: [XmlDomParsingEngine],
    };
}
