import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Loadables } from '../../core/src/JWEditor';
import { FollowRangeZoneNodeXmlDomParser } from './FollowRangeZoneNodeXmlDomParser';
import { FollowRangeZoneDomObjectRenderer } from './FollowRangeZoneDomObjectRenderer';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';

export class FollowRange<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Parser, Renderer, DomLayout, Layout];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [FollowRangeZoneNodeXmlDomParser],
        renderers: [FollowRangeZoneDomObjectRenderer],
    };
}
