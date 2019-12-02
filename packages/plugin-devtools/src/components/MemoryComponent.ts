import { CommandIdentifier } from '../../../core/src/Dispatcher';
import { OwlComponent } from '../../../plugin-owl/src/OwlComponent';
import { Memory, MemorySlice } from '../../../core/src/Memory/Memory';

export interface MemoryOrigin {
    base: string;
    current: string;
    layers: Set<string>;
    commandNames: string[];
    actionID: CommandIdentifier;
    isMaster: boolean;
    error: string;
}
interface AccessMemoryInformation {
    getOrigin: (key: string) => MemoryOrigin;
    getSlice: (key: string) => MemorySlice;
}

class MemoryIntermediate {
    static components = { MemoryIntermediate };
    static template = 'MemoryIntermediate';

    key: string;
    flux: MemoryIntermediateFlux;
    previous?: MemoryIntermediate;
    nexts: MemoryIntermediate[];
    origin: MemoryOrigin;
    height: number;
    width: number;
    offsetY: number;

    constructor(
        memoryInformation: AccessMemoryInformation,
        flux: MemoryIntermediateFlux,
        previous: MemoryIntermediate,
        key: string,
    ) {
        this.flux = flux;
        this.previous = previous;
        this.key = key;
        this.origin = memoryInformation.getOrigin(this.key);
        this.width = 0;
        this.offsetY = 0;
        this._addNexts(memoryInformation);
    }

    _addNexts(memoryInformation: AccessMemoryInformation): void {
        this.height = 0;
        this.nexts = [];
        const ref = memoryInformation.getSlice(this.key);
        let offsetY = 0;
        ref.children.forEach(ref => {
            const intermediate = new MemoryIntermediate(
                memoryInformation,
                this.flux,
                this,
                ref.name,
            );
            intermediate.offsetY = offsetY;
            offsetY += intermediate.height;
            this.nexts.push(intermediate);
            this.height += intermediate.height;
        });
        this.height = Math.max(this.height, 1);
        this.width = 1 + Math.max(0, ...this.nexts.map(intermediate => intermediate.width));
    }
}

class MemoryIntermediateFlux {
    static components = { MemoryIntermediate };
    static template = 'MemoryIntermediateFlux';

    key: string;
    intermediates: MemoryIntermediate[];
    height: number;
    width: number;
    origins: {
        offsetX: number;
        offsetY: number;
        intermediate: MemoryIntermediate;
    }[];

    constructor(
        memoryInformation: AccessMemoryInformation,
        key: string,
        originLayers: Set<string>,
    ) {
        this.key = key;
        this.origins = [];
        this._addIntermediates(memoryInformation);
        this._linkOrigins(originLayers, this.intermediates, 0, 1);
    }
    _addIntermediates(memoryInformation: AccessMemoryInformation): void {
        const ref = memoryInformation.getSlice(this.key);
        this.height = 0;
        this.intermediates = [];
        let offsetY = 0;
        this.width = 1;
        if (this.key === '') {
            return;
        }
        ref.children.forEach(ref => {
            const origin = memoryInformation.getOrigin(this.key);
            if (origin && !origin.isMaster) {
                const intermediate = new MemoryIntermediate(
                    memoryInformation,
                    this,
                    undefined,
                    ref.name,
                );
                intermediate.offsetY = offsetY;
                offsetY += intermediate.height;
                this.intermediates.push(intermediate);
                this.height += intermediate.height;
            }
        });
        this.width += Math.max(0, ...this.intermediates.map(intermediate => intermediate.width));
    }
    _linkOrigins(
        originLayers: Set<string>,
        intermediates: MemoryIntermediate[],
        offsetX: number,
        offsetY: number,
    ): void {
        offsetX++;
        intermediates.forEach(intermediate => {
            if (originLayers.has(intermediate.key)) {
                this.origins.push({
                    offsetX: offsetX,
                    offsetY: offsetY,
                    intermediate: intermediate,
                });
            }
            this._linkOrigins(originLayers, intermediate.nexts, offsetX, offsetY);
            offsetY += intermediate.height;
        });
        this.origins.sort((a, b) => a.offsetY - b.offsetY);
    }
}

class MemoryMaster {
    key: string;
    flux: MemoryIntermediateFlux;
    origin: MemoryOrigin;
    previous: MemoryMaster;
    nexts: MemoryMaster[];
    finished: boolean;
    height: number;
    width: number;
    offsetY: number;

    constructor(memoryInformation: AccessMemoryInformation, previous: MemoryMaster, key: string) {
        this.key = key;
        this.origin = memoryInformation.getOrigin(key);
        this.previous = previous;
        this.offsetY = 0;
        const previousNumber = this._previousNumber();
        this.flux = new MemoryIntermediateFlux(
            memoryInformation,
            this.origin.base,
            this.origin.layers,
        );
        this.nexts = [];
        let heightNexts = 0;
        if (previousNumber < 6) {
            this._addNexts(memoryInformation);
            this.nexts.forEach(master => {
                heightNexts += master.height;
            });
            this.finished = !this.nexts.length;
        } else {
            this.finished = !this._hasNext(memoryInformation);
        }
        this.height = Math.max(this.flux.height + 1, heightNexts);
        this.width = this.flux.width + Math.max(0, ...this.nexts.map(master => master.width));
    }

    _addNexts(memoryInformation: AccessMemoryInformation): void {
        const ref = memoryInformation.getSlice(this.key);
        let offsetY = 0;
        ref.children.forEach(ref => {
            if (
                memoryInformation.getOrigin(ref.name)?.isMaster &&
                !this.nexts.find(sub => sub.key === ref.name)
            ) {
                const master = new MemoryMaster(memoryInformation, this, ref.name);
                master.offsetY = offsetY;
                offsetY += master.height;
                this.nexts.push(master);
            }
        });
    }
    _hasNext(memoryInformation: AccessMemoryInformation): boolean {
        const ref = memoryInformation.getSlice(this.key);
        return !!ref.children.filter(ref => memoryInformation.getOrigin(ref.name)?.isMaster).length;
    }
    _previousNumber(): number {
        let number = 0;
        let master = this as MemoryMaster;
        while (master.previous) {
            number++;
            master = master.previous;
        }
        return number;
    }
}

class MemoryFlux {
    memory: Memory;
    first: MemoryMaster;
    activeSlice: MemoryMaster;
    origins: { [keyof: string]: MemoryOrigin };
    height: number;
    width: number;
    maxSlice = 4;

    constructor(component: MemoryComponent, activeSlice: string) {
        const memory = component.memory;
        this.origins = {};
        let rootSlice = memory._slices[activeSlice];
        let max = this.maxSlice;
        while (rootSlice.parent) {
            if (--max <= 0) {
                break;
            }
            rootSlice = rootSlice.parent;
        }

        this.first = new MemoryMaster(
            {
                getOrigin: (key: string): MemoryOrigin => {
                    if (!this.origins[key]) {
                        this.origins[key] = component.getOriginDeproxyfy(key);
                    }
                    return this.origins[key];
                },
                getSlice: (sliceKey: string): MemorySlice => {
                    return memory._slices[sliceKey];
                },
            } as AccessMemoryInformation,
            undefined,
            rootSlice.name,
        );
        this.height = this.first.height;
        this.width = this.first.width;
    }
}

class MemoryIntermediateLayout extends OwlComponent<{}> {
    static components = { MemoryIntermediateLayout };
    static template = 'MemoryIntermediateLayout';
    props: {
        intermediate: MemoryIntermediate;
    };
    selectAction(): void {
        console.log(this.props.intermediate.origin.actionID);
    }
    selectMemory(): void {
        this.trigger('memory-selected', {
            sliceKey: this.props.intermediate.key,
        });
    }
}
class MemoryIntermediateFluxLayout extends OwlComponent<{}> {
    static components = { MemoryIntermediateLayout };
    static template = 'MemoryIntermediateFluxLayout';
    flux = this.props['' + 'flux'] as MemoryIntermediateFlux;
}
class MemoryMasterLayout extends OwlComponent<{}> {
    static components = { MemoryIntermediateFluxLayout, MemoryMasterLayout };
    static template = 'MemoryMasterLayout';
    props: {
        master: MemoryMaster;
    };
    selectAction(): void {
        console.log(this.props.master.origin.actionID);
    }
    selectMemory(): void {
        this.trigger('memory-selected', {
            sliceKey: this.props.master.key,
        });
    }
    switchMemory(): void {
        this.trigger('memory-switch', {
            sliceKey: this.props.master.key,
        });
    }
}
class MemoryFluxLayout extends OwlComponent<{}> {
    static components = { MemoryMasterLayout };
    static template = 'MemoryFluxLayout';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MemoryComponent extends OwlComponent<any> {
    static components = { MemoryFluxLayout };
    static template = 'MemoryComponent';
    private _deproxyfy = {};
    memory = this.env.editor.memory;
    state = {
        flux: new MemoryFlux(this, this.env.editor.memoryInfo.current),
        flux2: undefined,
        activeSlice: this.env.editor.memoryInfo.current,
        selectedSlice: this.env.editor.memoryInfo.current,
        selected: this.getOriginDeproxyfy(this.env.editor.memoryInfo.current),
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    selectMemory(sliceKey: string): void {
        if (this.state.selectedSlice !== sliceKey) {
            this.state.selectedSlice = sliceKey;
            this.state.selected = this.getOriginDeproxyfy(sliceKey);
            this.render();
        }
    }
    onSwitchMemory(event: CustomEvent): void {
        const sliceKey: string = event.detail.sliceKey;
        this.memory.switchTo(sliceKey);

        // this.env.editor.dispatcher.dispatch('switchToMemorySlice', {
        //     origin: 'DevTools',
        //     payload: {
        //         sliceKey: sliceKey,
        //     },
        // });
        this._redraw();
    }
    onSelectMemory(event: CustomEvent): void {
        this.selectMemory(event.detail.sliceKey);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    willUpdateProps(nextProps: any): Promise<void> {
        this._redraw();
        return super.willUpdateProps(nextProps);
    }

    getOriginDeproxyfy(memorySliceKey: string): MemoryOrigin {
        if (this._deproxyfy[memorySliceKey]) {
            return this._deproxyfy[memorySliceKey];
        }
        const editor = this.env.editor;
        const memory = editor.memory;
        const memoryInfo = editor.memoryInfo;
        const oldKey = memory._sliceKey;
        memory.switchTo(memorySliceKey);
        const obj = {
            base: memoryInfo.base,
            current: memoryInfo.current,
            layers: new Set(memoryInfo.layers),
            commandNames: [...memoryInfo.commandNames],
            actionID: memoryInfo.actionID,
            isMaster: memoryInfo.isMaster,
            error: memoryInfo.error,
            children: [...memory._slices[memoryInfo.current].children].map(c => c.name),
            parent: memory._slices[memoryInfo.current].parent?.name,
        };
        memory.switchTo(oldKey);
        return (this._deproxyfy[memorySliceKey] = obj);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _redraw(): void {
        const sliceKey = this.env.editor.memoryInfo.current;
        this.state.activeSlice = sliceKey;
        this.state.selectedSlice = sliceKey;
        this.state.selected = this.getOriginDeproxyfy(sliceKey);
        const flux = new MemoryFlux(this, this.state.selectedSlice);
        if (this.state.flux) {
            this.state.flux = undefined;
            this.state.flux2 = flux;
        } else {
            this.state.flux = flux;
            this.state.flux2 = undefined;
        }
    }
}
