import { JWPlugin } from '../../core/src/JWPlugin';
import { BasicHtmlRenderingEngine } from './BasicHtmlRenderingEngine';

export class HtmlRenderer extends JWPlugin {
    static readonly renderingEngines = {
        html: BasicHtmlRenderingEngine,
    };
}
