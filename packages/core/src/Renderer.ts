import { VDocument } from './VDocument';

export class Renderer {
    static readonly id: string;
    render: (vDocument: VDocument, target: Element) => void;
}
