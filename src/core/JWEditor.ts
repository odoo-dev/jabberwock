import { Action } from './actions/Action';
import { Dispatcher } from './dispatcher/Dispatcher';
import { EventManager } from './utils/EventManager';
import { JWPlugin } from './JWPlugin';
import VDocument from './stores/VDocument';
import utils from './utils/utils';

export interface JWEditorConfig {
    theme: string;
};

export class JWEditor {
    el: HTMLElement;
    pluginsRegistry: JWPlugin[] = [];
    dispatcher : Dispatcher = new Dispatcher();

    constructor (el = document.body) {
        this.el = el;

        // hook events
        this.pluginsRegistry
        this._initPlugins();
        // this.el.addEventListener('keyup', ()=> {
        //     const action : Action = {

        //     }
        //     this.dispatcher.dispatch(this.plugins, action);
        // })

    }

    start () {
        this.el.setAttribute('contenteditable', 'true');
    }

    addPlugin(plugin: typeof JWPlugin) {
        this.pluginsRegistry.push(new plugin((ac)=>this.dispatcher));
    }

    loadConfig(config: JWEditorConfig) {
        // console.log(config.theme);
    }

    get _placeholderContent (): DocumentFragment {
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
        let fragment = document.createDocumentFragment();
        fragment.appendChild(title);
        fragment.appendChild(subtitle);
        fragment.appendChild(p);
        return fragment;
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
