import { Env, Component } from 'owl-framework/src/component/component';
import { JWPlugin } from '../core/JWPlugin';
import { PluginIntents, PluginActions, PluginCommands } from '../core/types/Flux';

export class OwlUIComponent extends Component<Env, {}, {}> {
    intents: PluginIntents = {};
    actions: PluginActions = {};
    commands: PluginCommands = {};
}

export class JWOwlUIPlugin extends JWPlugin {
    templates: string;
    componentsRegistry: Array<typeof OwlUIComponent> = [];
}
