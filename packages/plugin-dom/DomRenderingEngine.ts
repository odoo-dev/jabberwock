import { RenderingEngine } from '../core/src/RenderingEngine';
import { DefaultDomRenderer } from './DefaultDomRenderer';

export class DomRenderingEngine extends RenderingEngine<Node[]> {
    static readonly id = 'dom';
    static readonly defaultRenderer = DefaultDomRenderer;
}
