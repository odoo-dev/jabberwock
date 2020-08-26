import { VNode } from '../../core/src/VNodes/VNode';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import JWEditor from '../../core/src/JWEditor';

export function odooIconPostRender(node: VNode, domObject: DomObject, editor: JWEditor): DomObject {
    if (domObject && 'children' in domObject) {
        const icon = domObject.children[1];

        const dbclickCallback = (): void => {
            const params = { image: node };
            editor.execCommand('openMedia', params);
        };
        if ('tag' in icon) {
            const savedAttach = icon.attach;
            const savedDetach = icon.detach;
            icon.attach = (el: HTMLElement): void => {
                if (savedAttach) savedAttach(el);
                el.addEventListener('dblclick', dbclickCallback);
            };
            icon.detach = (el: HTMLElement): void => {
                if (savedAttach) savedDetach(el);
                el.removeEventListener('dblclick', dbclickCallback);
            };
        }
    }
    return domObject;
}
