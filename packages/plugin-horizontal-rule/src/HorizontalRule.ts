import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { HorizontalRuleXmlDomParser } from './HorizontalRuleXmlDomParser';
import { HorizontalRuleDomObjectRenderer } from './HorizontalRuleDomObjectRenderer';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export class HorizontalRule<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [HorizontalRuleXmlDomParser],
        renderers: [HorizontalRuleDomObjectRenderer],
    };
}
