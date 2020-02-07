import { VElement } from '../core/src/VNodes/VElement';

export class HeadingNode extends VElement {
    level: number;
    constructor(level: number) {
        super('H' + level);
        this.level = level;
    }
    get name(): string {
        return super.name + ': ' + this.level;
    }
    clone(): this {
        return new this.constructor<typeof HeadingNode>(this.level);
    }
}
