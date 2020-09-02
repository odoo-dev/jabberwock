interface BoundingRect {
    left: number;
    right: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
}
function getBoundingClientRect(elem: HTMLElement): BoundingRect {
    const box = elem.getBoundingClientRect();

    return {
        left: box.left + window.pageXOffset,
        right: box.right + window.pageXOffset,

        top: box.top + window.pageYOffset,
        bottom: box.bottom + window.pageYOffset,

        width: box.width,
        height: box.height,
    };
}

const POSITIONABLE_TAG_NAME = 'jw-positionable';
const POSITIONED_TAG_NAME = 'jw-positionned';

interface PositionableOptions {
    /**
     * The element in relative in which we base the position.
     */
    relativeElement: HTMLElement;
    /**
     * The element to position.
     */
    positionedElement: HTMLElement;
    /**
     * The container into which the box is held. If not provided, A
     * jw-positionable node will be appended in the body.
     */
    container?: HTMLElement;
}
export class Positionable {
    private _relativeElement: PositionableOptions['relativeElement'];
    private _positionedElement: PositionableOptions['positionedElement'];
    private _positionedElementContainer: HTMLElement;
    private _container: HTMLElement;
    constructor(options: PositionableOptions) {
        this._relativeElement = options.relativeElement;
        this._positionedElement = options.positionedElement;
        if (options.container) {
            this._container = options.container;
        } else {
            this._container = document.querySelector(POSITIONABLE_TAG_NAME);
            if (!this._container) {
                this._container = document.createElement(POSITIONABLE_TAG_NAME);
                this._container.style.display = 'block';
                this._container.style.position = 'relative';
            }
            document.body.prepend(this._container);
        }

        this._positionedElementContainer = document.createElement(POSITIONED_TAG_NAME);
        this._positionedElementContainer.style.position = 'absolute';
        this._positionedElementContainer.style['z-index'] = '10000';

        this._positionedElementContainer.appendChild(this._positionedElement);
        this._container.appendChild(this._positionedElementContainer);

        this._onScroll = this._onScroll.bind(this);
        this.bind();
        setTimeout(this.resetPositionedElement.bind(this), 0);
    }
    resetPositionedElement(): void {
        const coords1 = getBoundingClientRect(this._relativeElement);
        const coords2 = getBoundingClientRect(this._positionedElement);

        // right top position
        const x = coords1.right - coords2.width;
        const y = coords1.top - coords2.height;

        this._positionedElementContainer.style.left = x + 'px';
        this._positionedElementContainer.style.top = y + 'px';
    }
    bind(): void {
        document.body.addEventListener('scroll', this._onScroll, true);
    }
    unbind(): void {
        document.body.removeEventListener('scroll', this._onScroll, true);
    }
    destroy(): void {
        this.unbind();
        this._positionedElementContainer.remove();
        if (
            this._container.classList.contains(POSITIONABLE_TAG_NAME) &&
            this._container.parentElement === document.body
        ) {
            this._container.remove();
        }
    }
    private _onScroll(): void {
        this.resetPositionedElement();
    }
}
