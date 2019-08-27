import { Action, ActionType } from './actions/Action';
import { Dispatcher } from './dispatcher/Dispatcher';
import { JWPlugin } from './JWPlugin';

export interface JWEditorConfig {
    theme: string;
};

export class JWEditor {
    el: HTMLElement;
    dispatcher: Dispatcher<Action>;
    pluginsRegistry: JWPlugin[];

    constructor (el = document.body) {
        this.el = el;
        this.dispatcher = new Dispatcher();
        this.pluginsRegistry = [];
    }

    start () {
        this.el.setAttribute('contenteditable', 'true');
        this._placeholderContent.forEach(node => this.el.appendChild(node));
    }

    addPlugin(plugin: typeof JWPlugin) {
        this.pluginsRegistry.push(new plugin(this.dispatcher));
    }

    loadConfig(config: JWEditorConfig) {
        console.log(config.theme);
    }

    get _placeholderContent (): HTMLElement [] {
        let title = document.createElement('h1');
        title.appendChild(document.createTextNode('Jabberwocky'));
        let subtitle = document.createElement('h3');
        subtitle.appendChild(document.createTextNode('by Lewis Carroll'));
        let p = document.createElement('p');
        let i = document.createElement('i');
        p.appendChild(i);
        this._jabberwocky.split('\n').forEach(text => {
            let textNode = document.createTextNode(text);
            let br = document.createElement('br');
            i.appendChild(textNode);
            i.appendChild(br);
        });
        return [title, subtitle, p];
    }
    get _jabberwocky (): string {
        return `’Twas brillig, and the slithy toves
        Did gyre and gimble in the wabe:
        All mimsy were the borogoves,
        And the mome raths outgrabe.

        “Beware the Jabberwock, my son!
        The jaws that bite, the claws that catch!
        Beware the Jubjub bird, and shun
        The frumious Bandersnatch!”

        He took his vorpal sword in hand;
        Long time the manxome foe he sought—
        So rested he by the Tumtum tree
        And stood awhile in thought.

        And, as in uffish thought he stood,
        The Jabberwock, with eyes of flame,
        Came whiffling through the tulgey wood,
        And burbled as it came!

        One, two! One, two! And through and through
        The vorpal blade went snicker-snack!
        He left it dead, and with its head
        He went galumphing back.

        “And hast thou slain the Jabberwock?
        Come to my arms, my beamish boy!
        O frabjous day! Callooh! Callay!”
        He chortled in his joy.

        ’Twas brillig, and the slithy toves
        Did gyre and gimble in the wabe:
        All mimsy were the borogoves,
        And the mome raths outgrabe.`;
    }
};

export default JWEditor;
