import { AllowedMemory, PrePath, PreDiffChange, MemoryTypeValues, patches } from './Memory';
import { typeLinkedID } from './Versionable';
import { removedItem } from './const';
import { MemoryTypeArray } from './VersionableArray';

type Patch = Record<string, AllowedMemory>;

export class MemoryDiffArray {
    _parented: PrePath[];
    _ID: typeLinkedID;
    _ancestorPatch: Patch;
    _ancestorProps: Patch;
    _oldPatch: Patch;
    _oldProps: Patch;
    _newPatch: Patch;
    _newProps: Patch;
    _diffValueToObject: (value: MemoryTypeValues | object) => MemoryTypeValues | object;

    // eslint-disable-next-line max-params
    constructor(
        parented: PrePath[],
        ID: typeLinkedID,
        oldPatches: patches,
        newPatches: patches,
        ancestorPatches: MemoryTypeArray,
        valueToObject: (value: MemoryTypeValues | object) => MemoryTypeValues | object,
    ) {
        this._parented = parented;
        this._ID = ID;
        const old = this._compiledValues(oldPatches);
        const newer = this._compiledValues(newPatches);
        this._ancestorPatch = ancestorPatches.patch;
        this._ancestorProps = ancestorPatches.props;
        this._oldPatch = old.value;
        this._oldProps = old.props;
        this._newPatch = newer.value;
        this._newProps = newer.props;
        this._diffValueToObject = valueToObject;
    }

    getChanges(): PreDiffChange[] {
        const changes = [] as PreDiffChange[];
        this._addPropChanges(changes);
        const changesPatch = Object.assign(
            this._reversePatch(this._oldPatch, this._newPatch),
            this._filterPatch(this._newPatch, this._oldPatch),
        );
        const ancestorIndexes = this._getSortedArrayIndexes();
        const indexChanges = this._foundIndexesChanges(ancestorIndexes, changesPatch);
        this._convertToChange(changes, ancestorIndexes, changesPatch, indexChanges);
        changes.sort((a, b) => {
            return a.paths[a.paths.length - 1] > b.paths[b.paths.length - 1] ? 1 : -1;
        });
        return changes;
    }

    /////////////////////////////////////////////////////
    // private
    /////////////////////////////////////////////////////

    _compiledValues(patches: patches): { value: Patch; props: Patch } {
        const obj = {
            value: {},
            props: {},
        };
        while (patches && patches.length) {
            const patch = patches.pop();
            const memoryTypeArray = patch.value as MemoryTypeArray;
            Object.assign(obj.value, memoryTypeArray.patch);
            Object.assign(obj.props, memoryTypeArray.props);
        }
        return obj;
    }
    _addPropChanges(changes: PreDiffChange[]): void {
        const parented = this._parented;
        const ID = this._ID;
        const oldProps = this._oldProps;
        const newProps = this._newProps;
        const ancestorPatch = this._ancestorPatch;

        Object.keys(newProps).forEach(key => {
            if (
                key === 'length' ||
                oldProps[key] === newProps[key] ||
                (newProps[key] === removedItem && !(key in oldProps) && !(key in ancestorPatch))
            ) {
                return;
            }
            const change: PreDiffChange = {
                paths: parented.map(
                    (path): PrePath => {
                        return path.concat([[ID, 'attributes', key]]) as PrePath;
                    },
                ),
                type: 'attribute',
            };
            if (key in oldProps && oldProps[key] !== removedItem) {
                change.old = this._diffValueToObject(oldProps[key]);
            }
            if (key in newProps && newProps[key] !== removedItem) {
                change.new = this._diffValueToObject(newProps[key]);
            }
            changes.push(change);
        });
        Object.keys(oldProps).forEach(key => {
            if (key === 'length' || key in newProps) {
                return;
            }
            if (oldProps[key] === removedItem && !(key in newProps) && !(key in ancestorPatch)) {
                return;
            }
            const change: PreDiffChange = {
                paths: parented.map(
                    (path): PrePath => {
                        return path.concat([[ID, 'attributes', key]]) as PrePath;
                    },
                ),
                type: 'attribute',
                old: this._diffValueToObject(oldProps[key]),
            };
            changes.push(change);
        });
    }
    _getSortedArrayIndexes(): string[] {
        const ancestorPatch = this._ancestorPatch;
        const oldPatch = this._oldPatch;
        const indexes = [];
        Object.keys(ancestorPatch).forEach(uid => {
            if (ancestorPatch[uid] !== removedItem && oldPatch[uid] !== removedItem) {
                indexes.push(uid);
            }
        });
        Object.keys(oldPatch).forEach(uid => {
            if (!(uid in ancestorPatch) && oldPatch[uid] !== removedItem) {
                indexes.push(uid);
            }
        });
        indexes.sort();
        return indexes;
    }
    _reversePatch(patch: Patch, refPatch: Patch): Patch {
        const ancestorPatch = this._ancestorPatch;
        const reverse = {};
        Object.keys(patch).forEach(uid => {
            const value = patch[uid];
            let refValue = removedItem as AllowedMemory;
            if (uid in refPatch) {
                refValue = refPatch[uid];
            } else if (uid in ancestorPatch) {
                refValue = ancestorPatch[uid];
            }
            if (value !== refValue) {
                reverse[uid] = refValue;
            }
        });
        return reverse;
    }
    _filterPatch(patch: Patch, refPatch: Patch): Patch {
        const ancestorPatch = this._ancestorPatch;
        const filtered = {};
        Object.keys(patch).forEach(uid => {
            const value = patch[uid];
            let refValue = removedItem as AllowedMemory;
            if (uid in refPatch) {
                refValue = refPatch[uid];
            } else if (uid in ancestorPatch) {
                refValue = ancestorPatch[uid];
            }
            if (value !== refValue) {
                filtered[uid] = value;
            }
        });
        return filtered;
    }
    _foundIndexesChanges(
        ancestorIndexes: string[],
        patch: Patch,
    ): {
        add: [string, number][];
        update: [string, string, number][];
        remove: [string, number][];
    } {
        const ancestorPatch = this._ancestorPatch;
        const oldPatch = this._oldPatch;

        const len = ancestorIndexes.length;
        function foundPreviousIndex(uid: string): number {
            for (let k = 0; k < len; k++) {
                if (uid < ancestorIndexes[k]) {
                    return k - 1;
                }
            }
            return len - 1;
        }

        const indexes = Object.keys(patch);
        indexes.sort();

        const changes = [];
        indexes.forEach(uid => {
            const value = patch[uid];
            let oldValue = removedItem as AllowedMemory;
            if (uid in oldPatch) {
                oldValue = oldPatch[uid];
            } else if (uid in ancestorPatch) {
                oldValue = ancestorPatch[uid];
            }
            const index = foundPreviousIndex(uid);
            const last = changes[changes.length - 1];
            if (last && last[4] === removedItem && last[2] === index && oldValue === removedItem) {
                changes.pop();
                changes.push([uid, uid, index - 1, oldValue, value], last);
            } else {
                changes.push([uid, uid, index, oldValue, value]);
            }
        });

        const add = [];
        const update = [];
        const remove = [];
        changes.forEach((change, index) => {
            const last = changes[index - 1];
            if (
                last &&
                last[3] === change[4] &&
                last[4] === change[3] &&
                ((last[4] !== removedItem && last[2] === change[2] - 1) ||
                    (last[4] === removedItem && last[2] === change[2]))
            ) {
                if (change[4] === removedItem) {
                    add.pop();
                } else {
                    remove.pop();
                }
            } else if (change[3] === removedItem) {
                add.push([change[1], change[2]]);
            } else if (change[4] === removedItem) {
                remove.push([change[0], change[2]]);
            } else {
                update.push(change.slice(0, 3));
            }
        });

        return { add, update: update, remove };
    }
    _convertToChange(
        changes: PreDiffChange[],
        oldIndexes: string[],
        patch: Patch,
        indexChanges: {
            add: [string, number][];
            update: [string, string, number][];
            remove: [string, number][];
        },
    ): PreDiffChange[] {
        const ancestorPatch = this._ancestorPatch;
        const oldPatch = this._oldPatch;

        const parented = this._parented;
        const ID = this._ID;

        const usedIndex = {};
        function foundSubIndex(index: number): string {
            const subIndex = index in usedIndex ? usedIndex[index] + 1 : 1;
            usedIndex[index] = subIndex;
            return index + ',' + subIndex;
        }
        function pathMap(index: string): PrePath[] {
            return parented.map(
                (path): PrePath => {
                    return path.concat([[ID, 'values', index]]) as PrePath;
                },
            );
        }

        indexChanges.add.forEach(add => {
            changes.push({
                paths: pathMap(foundSubIndex(add[1])),
                type: 'values',
                new: this._diffValueToObject(patch[add[0]]),
            } as PreDiffChange);
        });
        indexChanges.update.forEach(update => {
            const oldValue = oldPatch[update[1]];
            changes.push(
                {
                    paths: pathMap(foundSubIndex(update[2] - 1)),
                    type: 'values',
                    new: this._diffValueToObject(patch[update[0]]),
                } as PreDiffChange,
                {
                    paths: pathMap(update[2].toString()),
                    type: 'values',
                    old: this._diffValueToObject(oldValue),
                } as PreDiffChange,
            );
        });
        indexChanges.remove.forEach(remove => {
            let oldValue = removedItem as AllowedMemory;
            if (remove[0] in oldPatch) {
                oldValue = oldPatch[remove[0]];
            } else {
                oldValue = ancestorPatch[remove[0]];
            }
            changes.push({
                paths: pathMap(remove[1].toString()),
                type: 'values',
                old: this._diffValueToObject(oldValue),
            } as PreDiffChange);
        });

        // length

        const add = indexChanges.add.length - indexChanges.remove.length;
        if (add !== 0) {
            const change: PreDiffChange = {
                paths: parented.map(
                    (path): PrePath => {
                        return path.concat([[ID, 'attributes', 'length']]) as PrePath;
                    },
                ),
                type: 'attribute',
            };
            change.old = oldIndexes.length;
            change.new = oldIndexes.length + add;
            changes.push(change);
        }

        return changes;
    }
}
