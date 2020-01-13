import { VElement } from '../core/src/VNodes/VElement';

export class HeadingNode extends VElement {
    level: number;
    constructor(level: number) {
        super('H' + level);
        this.level = level;
    }
}
