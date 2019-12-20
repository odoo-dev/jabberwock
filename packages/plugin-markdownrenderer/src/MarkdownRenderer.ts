import { JWPlugin } from '../../core/src/JWPlugin';
import { BasicMarkdownRenderingEngine } from './BasicMarkdownRenderingEngine';

export class MarkdownRenderer extends JWPlugin {
    static readonly renderingEngines = {
        markdown: BasicMarkdownRenderingEngine,
    };
}
