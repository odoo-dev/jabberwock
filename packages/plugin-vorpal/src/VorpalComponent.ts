/* eslint-disable @typescript-eslint/no-empty-function */
import { OwlComponent } from '../../plugin-owl/src/ui/OwlComponent';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/ui/DomLayoutEngine';

export class VorpalComponent<T = {}> extends OwlComponent<T> {
    state = {
        play: false,
        jabberwock: {
            all: {
                nervous: false,
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0,
                speed: 0,
                before: (): void => {},
                after: (): void => {},
            },
            head: {
                state: '',
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0,
                speed: 0,
                before: (): void => {},
                after: (): void => {},
            },
            rightHand: {
                state: 'open',
                x: -36,
                y: 65,
                targetX: 0,
                targetY: 0,
                speed: 0,
                before: (): void => {},
                after: (): void => {},
            },
            leftHand: {
                state: 'open',
                x: 36,
                y: 65,
                targetX: 0,
                targetY: 0,
                speed: 0,
                before: (): void => {},
                after: (): void => {},
            },
        },
        sword: {
            state: '',
            x: -100,
            y: 0,
            targetX: 0,
            targetY: 0,
            speed: 0,
            before: (): void => {},
            after: (): void => {},
        },
    };
    editableClone: HTMLElement;
    sword: HTMLElement;
    jabberwock: HTMLElement;
    animationMovedChars: HTMLElement[] = [];
    animationMovedCharPromises: Promise<void>[] = [];
    animationMovedCharPromiseCallbacks: Array<(value?: void | PromiseLike<void>) => void> = [];

    async willStart(): Promise<void> {
        window.addEventListener('keydown', this._onKeydown.bind(this));
        return super.willStart();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    play(): void {
        this.state.play = true;
        this.sword = this.el.querySelector('jw-sword') as HTMLElement;
        this.jabberwock = this.el.querySelector('jw-jabberwock') as HTMLElement;

        this._cloneEditable();
        document.body.classList.add('vorpal');

        this.state.sword.x = -100;
        this.state.sword.y = 0;
        this.state.sword.speed = 0;

        this._appearAnimation();

        requestAnimationFrame(this._animationFrame.bind(this));
    }
    stop(): void {
        this.state.play = false;
        document.body.classList.remove('vorpal');
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _cloneEditable(): void {
        const domEngine = this.env.editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
        const editable = domEngine.components.get('editable')[0];
        const domEditable = domEngine.getDomNodes(editable)[0] as HTMLElement;

        this.editableClone = this.el.querySelector('jw-editable-clone') as HTMLElement;
        this.editableClone.innerHTML = domEditable.innerHTML;
        const texts: Text[] = [];
        const nodes = [].slice.call(this.editableClone.querySelectorAll('*'));
        nodes.push(this.editableClone);
        nodes.forEach((node: HTMLElement) => {
            node.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    texts.push(node as Text);
                }
            });
        });

        this.animationMovedChars = [];
        texts.forEach(text => {
            const s = text.textContent;
            for (let i = 0; i < s.length; i++) {
                const span = document.createElement('span');
                span.className = 'separate-char';

                const movable = document.createElement('span');
                movable.className = 'movable';
                movable.textContent = s[i];
                span.appendChild(movable);
                this.animationMovedChars.push(movable);

                const invisible = document.createElement('span');
                invisible.className = 'invisible';
                invisible.textContent = s[i];
                span.appendChild(invisible);

                text.parentNode.insertBefore(span, text);
            }
            text.parentNode.removeChild(text);
        });
    }

    _animationFrame(): void {
        const all = this.state.jabberwock.all;
        ['all', 'head', 'rightHand', 'leftHand'].forEach(part => {
            const item = this.state.jabberwock[part];
            item.before();
            if (item.speed <= 0) {
                return;
            }
            let targetX = item.targetX;
            let targetY = item.targetY;
            if (item !== all) {
                targetX -= all.x;
                targetY -= all.y;
            }
            this._animationFrameMove(item, targetX, targetY);
            item.after();
        });

        const sword = this.state.sword;
        sword.before();
        this._animationFrameMove(sword, sword.targetX, sword.targetY);
        sword.after();

        this._animationChars();

        if (this.state.play) {
            requestAnimationFrame(this._animationFrame.bind(this));
        }
    }
    _animationFrameMove(item, targetX: number, targetY: number): void {
        const dist = Math.sqrt(Math.pow(item.x - targetX, 2) + Math.pow(item.y - targetY, 2));

        if (dist <= item.speed) {
            item.x = targetX;
            item.y = targetY;
        } else {
            const dx = ((targetX - item.x) / dist) * item.speed;
            const dy = ((targetY - item.y) / dist) * item.speed;
            item.x += dx;
            item.y += dy;
        }
    }
    _animationChars(): void {
        const pos = this.editableClone.getBoundingClientRect();
        const targetY = pos.height - 50;

        this.animationMovedChars.forEach((char, index) => {
            if (char.classList.contains('fall')) {
                let top = char.style.top ? parseInt(char.style.top, 10) + 16 : 16;
                const max = targetY - +char.getAttribute('fall-origin');
                if (top >= max) {
                    top = max;
                    char.classList.remove('fall');
                    char.classList.add('falled');
                    this.animationMovedCharPromiseCallbacks[index]();
                }
                char.style.top = top + 'px';
            }
        });
    }
    async _appearAnimation(): Promise<void> {
        this.state.jabberwock.all.nervous = true;
        this.state.jabberwock.rightHand.state = 'grabbing';
        this.state.jabberwock.leftHand.state = 'grabbing';

        const pos = this.editableClone.getBoundingClientRect();
        const left = pos.width / 2;
        this.state.jabberwock.all.x = left;
        this.state.jabberwock.all.y = 100;

        await new Promise(done => setTimeout(done, 500));
        await this._fallingChars();
        this.state.jabberwock.all.nervous = false;
        await this._grabSword();
    }
    async _grabSword(): Promise<void> {
        const pos = this.sword.getBoundingClientRect();
        const all = this.state.jabberwock.all;
        const rightHand = this.state.jabberwock.rightHand;
        const sword = this.state.sword;

        await new Promise(done => {
            rightHand.targetX = pos.left;
            rightHand.targetY = pos.top;
            rightHand.speed = 14;
            rightHand.before = (): void => {};
            rightHand.after = (): void => {
                if (
                    rightHand.x === rightHand.targetX - all.x &&
                    rightHand.y === rightHand.targetY - all.y
                ) {
                    done();
                }
            };
        });

        this.state.jabberwock.rightHand.state = 'close';
        this.state.sword.state = 'grabbed';

        await new Promise(done => {
            rightHand.targetX = pos.left;
            rightHand.targetY = pos.top;
            rightHand.speed = 14;
            rightHand.before = (): void => {
                rightHand.targetX = all.x - 36;
                rightHand.targetY = all.y + 65;
            };
            rightHand.after = (): void => {};

            sword.targetX = pos.left;
            sword.targetY = pos.top;
            sword.speed = 14;
            sword.before = (): void => {
                sword.targetX = all.x + rightHand.x;
                sword.targetY = all.y + rightHand.y;
            };
            sword.after = (): void => {
                if (
                    rightHand.x === rightHand.targetX - all.x &&
                    rightHand.y === rightHand.targetY - all.y
                ) {
                    done();
                }
            };
        });

        await new Promise(done => {
            setTimeout(done, 500);
        });

        this.state.jabberwock.rightHand.state = 'open';

        setTimeout(() => (this.state.jabberwock.rightHand.state = 'grabbing'), 500);

        await new Promise(done => {
            const pos = this.editableClone.getBoundingClientRect();
            sword.targetY = pos.height - 50;
            sword.speed = 8;
            sword.before = (): void => {};
            sword.after = (): void => {
                if (sword.y === sword.targetY) {
                    done();
                }
            };
        });
    }
    async _fallingChars(): Promise<void> {
        this.state.jabberwock.rightHand.state = 'grab';
        this.state.jabberwock.leftHand.state = 'grab';
        this.editableClone.classList.add('shake-chars');
        this.animationMovedCharPromises = this.animationMovedChars.map((char, index) => {
            const pos = char.getBoundingClientRect();
            const style = window.getComputedStyle(char);
            const charHeight = parseInt(style.height, 10);
            const center = parseInt(style.transformOrigin, 10);
            char.setAttribute('fall-origin', pos.top + charHeight - center);

            return new Promise(resolve => {
                setTimeout(() => {
                    char.classList.add('fall');
                    this.animationMovedCharPromiseCallbacks[index] = resolve;
                }, Math.random() * 3000);
                return;
            });
        });
        await new Promise(done => setTimeout(done, 3000));
        this.editableClone.classList.remove('shake-chars');
        this.state.jabberwock.rightHand.state = 'grabbing';
        this.state.jabberwock.leftHand.state = 'grabbing';
    }

    //--------------------------------------------------------------------------
    // Handle
    //--------------------------------------------------------------------------

    _onKeydown(ev: KeyboardEvent): void {
        if (!this.state.play) {
            if (ev.key === 'F10') {
                this.play();
            }
        } else {
            if (ev.key === 'Escape') {
                this.stop();
            }
            if (ev.key.indexOf('Arrow') === 0) {
                console.log(ev.key);
            }
        }
    }
}
