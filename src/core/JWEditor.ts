import { Action } from './actions/Action.js';
import { Dispatcher } from './dispatcher/Dispatcher.js';
import { JWPlugin } from './JWPlugin.js';
import { Batch } from './operations/Batch';
import { OperationInsertChar } from './operations/OprerationInsertChar';
import VDocument from './stores/VDocument.js';
import { EventManager } from './utils/EventManager.js';
import utils from './utils/utils.js';
import { ActionType } from './actions/Action';

export interface JWEditorConfig {
    theme: string;
}

export class JWEditor {
    el: HTMLElement;
    dispatcher: Dispatcher<Action>;
    eventManager: EventManager;
    pluginsRegistry: JWPlugin[];
    vDocument: VDocument;

    constructor(el = document.body) {
        this.el = el;
        this.dispatcher = new Dispatcher();
        this.eventManager = new EventManager(this.el, this.el, {
            dispatch: (action: Action): void => {
                // make an operation
                if (action.type === ActionType.INSERT) {
                    console.log('new insert operation');
                    const batch = new Batch([new OperationInsertChar(1)]);
                    this.vDocument.processBatch(batch);
                } else {
                    console.log('another action than insert :', action);
                }
            },
        });

        // eventNormalizer
        // eventManager
        // dispatch
        // update model
        // update render (with minimal diff)

        this.pluginsRegistry = [];
        let startContent: DocumentFragment;
        if (el.children.length) {
            startContent = document.createDocumentFragment();
            const contents = utils._collectionToArray(el.childNodes);
            contents.forEach(child => startContent.appendChild(child));
        } else {
            startContent = this._placeholderContent;
        }
        this.vDocument = new VDocument(startContent);
        // todo: move to Renderer
        this.el.childNodes.forEach(child => child.remove());
        utils._collectionToArray(startContent.childNodes).forEach(node => {
            this.el.appendChild(node);
        });
    }

    start() {
        this.el.setAttribute('contenteditable', 'true');
    }

    addPlugin(plugin: typeof JWPlugin) {
        this.pluginsRegistry.push(new plugin(this.dispatcher, this.vDocument)); // todo: use state
    }

    loadConfig(config: JWEditorConfig) {
        // console.log(config.theme);
    }

    get _placeholderContent(): DocumentFragment {
        const title = document.createElement('h1');
        title.appendChild(document.createTextNode('Jabberwocky'));
        const subtitle = document.createElement('h3');
        subtitle.appendChild(document.createTextNode('by Lewis Carroll'));
        const p = document.createElement('p');
        const i = document.createElement('i');
        p.appendChild(i);
        this._jabberwocky.split('\n').forEach(text => {
            const textNode = document.createTextNode(text);
            const br = document.createElement('br');
            i.appendChild(textNode);
            i.appendChild(br);
        });
        const fragment = document.createDocumentFragment();
        fragment.appendChild(title);
        fragment.appendChild(subtitle);
        fragment.appendChild(p);
        return fragment;
    }
    get _jabberwocky(): string {
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
}

export default JWEditor;
