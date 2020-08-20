import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { VersionableObject } from '../../core/src/Memory/VersionableObject';
import { ModifierPreserve } from '../../core/src/Modifier';

export class BootstrapButtonNode extends ContainerNode {
    htmlTag = 'A';
    preserve = new VersionableObject({
        after: true,
        paragraphBreak: false,
        lineBreak: true,
    }) as ModifierPreserve;
}
