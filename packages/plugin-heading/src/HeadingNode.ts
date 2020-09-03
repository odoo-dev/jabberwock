import { TagNode } from '../../core/src/VNodes/TagNode';

export class HeadingNode extends TagNode {
    mayContainContainers = false;
    level: number;
    constructor(params: { level: number }) {
        super({ htmlTag: 'H' + params.level });
        this.level = params.level;
    }
    get name(): string {
        return super.name + ': ' + this.level;
    }
    clone(deepClone?: boolean, params?: {}): this {
        const defaults: ConstructorParameters<typeof HeadingNode>[0] = {
            level: this.level,
        };
        return super.clone(deepClone, { ...defaults, ...params });
    }
}
