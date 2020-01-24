import { JWPlugin } from '../core/src/JWPlugin';
import { DomRenderer } from './DomRenderer';

export class Dom extends JWPlugin {
    static readonly renderers = [new DomRenderer()];
}
