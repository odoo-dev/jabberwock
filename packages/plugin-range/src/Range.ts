import { JWPlugin } from '../../core/src/JWPlugin';
import { RangeNode } from './VNodes/RangeNode';

export class Range extends JWPlugin {
    static readonly nodes = [RangeNode];
}
