import { JWPlugin } from '../core/src/JWPlugin';
import { DomRenderer } from './DomRenderer';

export class Dom extends JWPlugin {
    readonly renderers = [new DomRenderer()];
}
