import { CommandIdentifier, CommandArgs } from '../../../core/src/Dispatcher';
import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { Env } from 'owl-framework/src/component/component';
import { Memory, MemoryReference } from '../../../core/src/Memory/Memory';

function getOriginDeproxyfy(env: Env, memory: Memory, memorySliceKey: string): MemoryOrigin {
    const stack = new Map();
    let pulling = false;
    function pull(): void {
        if (pulling) {
            return;
        }
        pulling = true;
        stack.forEach((res, proxy) => {
            res.value = deproxyfy(proxy);
            res.callbacks.forEach(callback => callback(res.value));
        });
        pulling = false;
    }
    function addToStack(proxy, callback): void {
        const res = stack.get(env.editor.origin) || {
            callbacks: [],
            value: undefined,
        };
        if (res.value) {
            callback(res.value);
            return;
        }
        stack.set(proxy, res);
        res.callbacks.push(callback);
        pull();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function deproxyfy(proxy: object): any {
        if (proxy instanceof Set) {
            const set = new Set();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            proxy.forEach((value: any) => {
                if (value && typeof value === 'object') {
                    addToStack(value, value => set.add(value));
                } else {
                    set.add(value);
                }
            });
            return set;
        } else if (proxy instanceof Array) {
            const array = [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            proxy.forEach((value: any) => {
                if (value && typeof value === 'object') {
                    addToStack(value, value => array.push(value));
                } else {
                    array.push(value);
                }
            });
            return array;
        } else {
            const obj = {};
            Object.keys(proxy).forEach(key => {
                const value = proxy[key];
                if (value && typeof value === 'object') {
                    addToStack(value, value => (obj[key] = value));
                } else {
                    obj[key] = value;
                }
            });
            return obj;
        }
    }

    const oldKey = memory._sliceKey;
    memory.switchTo(memorySliceKey);
    const obj = deproxyfy(env.editor.origin);
    memory.switchTo(oldKey);

    return obj;
}

export interface MemoryOrigin {
    base: string;
    layers: Set<string>;
    actionID: CommandIdentifier;
    actionArgs: CommandArgs;
    isMaster: boolean;
}
interface AccessMemoryInformation {
    getOrigin: (key: string) => MemoryOrigin;
    getReference: (key: string) => MemoryReference;
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
        const ref = memoryInformation.getReference(this.key);
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
        const ref = memoryInformation.getReference(this.key);
        this.height = 0;
        this.intermediates = [];
        let offsetY = 0;
        this.width = 1;
        if (this.key === '') {
            return;
        }
        ref.children.forEach(ref => {
            if (!memoryInformation.getOrigin(this.key).isMaster) {
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
        const ref = memoryInformation.getReference(this.key);
        let offsetY = 0;
        ref.children.forEach(ref => {
            if (
                memoryInformation.getOrigin(ref.name).isMaster &&
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
        const ref = memoryInformation.getReference(this.key);
        return !!ref.children.filter(ref => memoryInformation.getOrigin(ref.name).isMaster).length;
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

    constructor(env: Env, memory: Memory, activeSlice: string) {
        this.origins = {};
        let rootSlice = memory._slicesReference[activeSlice];
        let max = 4;
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
                        this.origins[key] = getOriginDeproxyfy(env, memory, key);
                    }
                    return this.origins[key];
                },
                getReference: (sliceKey: string): MemoryReference => {
                    return memory._slicesReference[sliceKey];
                },
            } as AccessMemoryInformation,
            undefined,
            rootSlice.name,
        );
        this.height = this.first.height;
        this.width = this.first.width;
    }
}

class MemoryIntermediateLayout extends OwlUIComponent<{}> {
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
class MemoryIntermediateFluxLayout extends OwlUIComponent<{}> {
    static components = { MemoryIntermediateLayout };
    static template = 'MemoryIntermediateFluxLayout';
    flux = this.props['' + 'flux'] as MemoryIntermediateFlux;
}
class MemoryMasterLayout extends OwlUIComponent<{}> {
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
class MemoryFluxLayout extends OwlUIComponent<{}> {
    static components = { MemoryMasterLayout };
    static template = 'MemoryFluxLayout';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class MemoryComponent extends OwlUIComponent<any> {
    static components = { MemoryFluxLayout };
    static template = 'MemoryComponent';
    memory = this.env.editor.memory;
    state = {
        flux: new MemoryFlux(this.env, this.memory, this.memory._sliceKey),
        flux2: undefined,
        activeSlice: this.memory._sliceKey,
        selectedSlice: this.memory._sliceKey,
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    selectMemory(sliceKey: string): void {
        if (this.state.selectedSlice !== sliceKey) {
            this.state.selectedSlice = sliceKey;
            this.render();
        }
    }
    onSwitchMemory(event: CustomEvent): void {
        const sliceKey: string = event.detail.sliceKey;
        const diff = this.memory.diff(this.state.activeSlice, sliceKey);
        this.memory.switchTo(sliceKey);

        this.env.editor.dispatcher.dispatch('switchToMemorySlice', {
            origin: 'DevTools',
            payload: {
                sliceKey: sliceKey,
                diff: diff,
            },
        });
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

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _redraw(): void {
        this.state.activeSlice = this.memory._sliceKey;
        this.state.selectedSlice = this.memory._sliceKey;
        const flux = new MemoryFlux(this.env, this.memory, this.state.selectedSlice);
        if (this.state.flux) {
            this.state.flux = undefined;
            this.state.flux2 = flux;
        } else {
            this.state.flux = flux;
            this.state.flux2 = undefined;
        }
    }
}
