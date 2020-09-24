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

export enum PositionableVerticalAlignment {
    TOP = 'TOP',
    BOTTOM = 'BOTTOM',
}
export enum PositionableHorizontalAlignment {
    LEFT = 'LEFT',
    RIGHT = 'RIGHT',
}

interface PositionableOptions {
    /**
     * The element in relative in which we base the position.
     */
    relativeElement?: HTMLElement;
    /**
     * The element to position.
     */
    positionedElement: HTMLElement;
    /**
     * Vertical alignment.
     */
    verticalAlignment?: PositionableVerticalAlignment;
    /**
     * Vertical alignment.
     */
    horizontalAlignment?: PositionableHorizontalAlignment;
    /**
     * The container into which the box is held. If not provided, A
     * jw-positionable node will be appended in the body.
     */
    container?: HTMLElement;
}
export class Positionable {
    private _relativeElement?: PositionableOptions['relativeElement'];
    private _positionedElement: PositionableOptions['positionedElement'];
    private _positionedElementContainer: HTMLElement;
    private _container: HTMLElement;
    private _verticalAlignment: PositionableOptions['verticalAlignment'];
    private _horizontalAlignment: PositionableOptions['horizontalAlignment'];
    private _resizeObserver: ResizeObserver;

    constructor(options: PositionableOptions) {
        this._resizeObserver = new ResizeObserver(this.resetPositionedElement.bind(this));
        if (options.relativeElement) {
            this.resetRelativeElement(options.relativeElement);
        }
        this._positionedElement = options.positionedElement;
        this._verticalAlignment = options.verticalAlignment || PositionableVerticalAlignment.TOP;
        this._horizontalAlignment =
            options.horizontalAlignment || PositionableHorizontalAlignment.LEFT;

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
    resetRelativeElement(element: HTMLElement): void {
        if (this._relativeElement) {
            this._resizeObserver.unobserve(this._relativeElement);
        }
        this._relativeElement = element;
        this._resizeObserver.observe(this._relativeElement);
    }
    resetPositionedElement(): void {
        if (!this._relativeElement) return;

        const coords1 = getBoundingClientRect(this._relativeElement);
        const coords2 = getBoundingClientRect(this._positionedElement);

        let x: number;
        let y: number;
        if (this._verticalAlignment === PositionableVerticalAlignment.TOP) {
            y = coords1.top - coords2.height;
        } else {
            y = coords1.top + coords2.height;
            console.log('coords1.top:', coords1.top);
            console.log('coords2.height:', coords2.height);
            console.log('y', y);
        }
        if (this._horizontalAlignment === PositionableHorizontalAlignment.RIGHT) {
            x = coords1.right - coords2.width;
        } else {
            x = coords1.left;
        }

        this._positionedElementContainer.style.left = x + 'px';
        this._positionedElementContainer.style.top = y + 'px';
    }
    bind(): void {
        console.log('bind');
        document.body.addEventListener('scroll', this._onScroll, true);
    }
    unbind(): void {
        console.log('unbind');
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
        console.log('resetpositioned');
        this.resetPositionedElement();
    }
}
