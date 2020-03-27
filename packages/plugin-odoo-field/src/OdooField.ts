import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { OdooFieldDomRenderer } from './OdooFieldDomRenderer';
import { OdooFieldDomParser } from './OdooFieldDomParser';
import { OdooReactiveRegistry } from '../../plugin-odoo-reactive-registry/src/OdooReactiveRegistry';
import { Dom } from '../../plugin-dom/src/Dom';

export class OdooField<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [OdooReactiveRegistry, Dom];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [OdooFieldDomParser],
        renderers: [OdooFieldDomRenderer],
    };
}
