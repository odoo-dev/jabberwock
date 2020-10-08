import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Loadables } from '../../core/src/JWEditor';
import { NativeSelectVNodeDomObjectRenderer } from './NativeSelectVNodeDomObjectRenderer';
import { NativeSelectActionableGroupDomObjectRenderer } from './NativeSelectActionableGroupDomObjectRenderer';

export class NativeSelect<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Renderer> = {
        renderers: [
            NativeSelectVNodeDomObjectRenderer,
            NativeSelectActionableGroupDomObjectRenderer,
        ],
    };
}
