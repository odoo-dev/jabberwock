import { expect } from 'chai';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Fullscreen } from '../src/Fullscreen';
import { click } from '../../utils/src/testUtils';
import { Toolbar } from '../../plugin-toolbar/src/Toolbar';

const container = document.createElement('div');
container.classList.add('container');
const target = document.createElement('div');
target.classList.add('editable');

function waitFullscreenRedraw(): Promise<void> {
    // because trigger a window resize
    return new Promise(r => setTimeout(r, 5));
}

describe('Fullscreen', () => {
    beforeEach(() => {
        document.body.appendChild(container);
        container.appendChild(target);
    });
    afterEach(() => {
        document.body.removeChild(container);
        container.innerHTML = '';
        target.innerHTML = '';
    });
    it('sould start the fullscreen mode', async () => {
        const editor = new BasicEditor({ editable: target });
        editor.configure(Toolbar, { layout: [['LinkButton', 'FullscreenButton']] });
        await editor.start();
        expect(container.firstElementChild.classList.contains('jw-fullscreen')).to.equal(false);
        expect(document.body.classList.contains('jw-fullscreen')).to.equal(false, 'body');
        await click(container.querySelector('button[name="fullscreen"]'));
        await waitFullscreenRedraw();
        expect(container.firstElementChild.classList.contains('jw-fullscreen')).to.equal(true);
        expect(document.body.classList.contains('jw-fullscreen')).to.equal(true, 'body');
        expect(container.querySelector('button[name="fullscreen"]').outerHTML).to.equal(
            '<button name="fullscreen" title="Toggle Fullsreen" class="fas fa-expand fa-fw pressed" aria-pressed="true"></button>',
        );
        await editor.stop();
        expect(document.body.classList.contains('jw-fullscreen')).to.equal(
            false,
            'body after stop',
        );
        expect(container.innerHTML).to.equal('<div class="editable"></div>', 'after stop');
    });
    it('sould stop the fullscreen mode', async () => {
        const editor = new BasicEditor({ editable: target });
        editor.configure(Toolbar, { layout: [['LinkButton', 'FullscreenButton']] });
        await editor.start();
        await click(container.querySelector('button[name="fullscreen"]'));
        await waitFullscreenRedraw();
        await click(container.querySelector('button[name="fullscreen"]'));
        await waitFullscreenRedraw();
        expect(container.firstElementChild.classList.contains('jw-fullscreen')).to.equal(false);
        expect(document.body.classList.contains('jw-fullscreen')).to.equal(false, 'body');
        expect(container.querySelector('button[name="fullscreen"]').outerHTML).to.equal(
            '<button name="fullscreen" title="Toggle Fullsreen" class="fas fa-expand fa-fw" aria-pressed="false"></button>',
        );
        await editor.stop();
    });
    it('sould start the fullscreen mode on a other component', async () => {
        const editor = new BasicEditor({ editable: target });
        editor.configure(Fullscreen, { component: 'editable' });
        editor.configure(Toolbar, { layout: [['LinkButton', 'FullscreenButton']] });
        await editor.start();
        await click(container.querySelector('button[name="fullscreen"]'));
        await waitFullscreenRedraw();
        expect(container.querySelector('.editable').classList.contains('jw-fullscreen')).to.equal(
            true,
        );
        expect(document.body.classList.contains('jw-fullscreen')).to.equal(true, 'body');
        await editor.stop();
        expect(document.body.classList.contains('jw-fullscreen')).to.equal(
            false,
            'body after stop',
        );
    });
});
