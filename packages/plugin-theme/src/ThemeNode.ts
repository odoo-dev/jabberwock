import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

export class ThemeNode extends ContainerNode {
    themeName: string;
    constructor(params: { theme: string }) {
        super();
        this.themeName = params.theme || 'default';
    }
}
