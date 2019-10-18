import { Random } from '../../Random';

type ID = number[];

/**
 * This [CRDT structure](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type)
 * allow to allocate ID between two items within a sequence while preserving the ID of any item.
 *
 *
 * In order to allow to insert between two item while preserving the original, the structure of the
 * ID is an array of integer.
 *
 * If we want to insert between the ID [1] and [2], the `alloc` method might generate the id: [1, 5].
 * The length of the array that represent the id is called the `depth`.
 *
 * To allocate with good spacial performance we implemented the
 * [LSEQ](https://hal.archives-ouvertes.fr/hal-00921633/document) algorithm.
 * The allocation strategy could be what we call "boundary+" or "boundary-" depending on the
 * `depth`.
 *
 * The boundary+ strategy generate a random number from "0" to `boundary`.
 * The boundary- strategy generate a random number from
 * "depth max number"-"boundary" to "depth max number"
 *
 * More information can be found here:
 * https://hal.archives-ouvertes.fr/hal-00921633/document
 */
export class CRDT {
    /**
     * The maximal value we increment or decrement when allocating a new id.
     */
    boundary = 20;

    /**
     * Hold a generated strategy for a particular depth.
     *
     * If `strategy = [true, false, false]`, this mean:
     * strategy[0] (depth 1) = true = boundary+
     * strategy[1] (depth 2) = false = boundary-
     * strategy[2] (depth 3) = false = boundary-
     */
    strategy: boolean[] = [];

    /**
     * When allocating increasing the `depth`, the range of possible number at that `depth`,
     * is `Math.pow(2, base + depth - 1)`.
     *
     * We subtract 1 from `depth` because `depth` start at 1.
     */
    base: number;

    random: Random;

    constructor(base = 4) {
        this.random = new Random(214748368947.58);
        this.base = base;
    }

    /**
     * Allocate an ID between `leftID` and `rightID`.
     *
     * @param leftID
     * @param rightID
     * @return The newly generated ID.
     */
    alloc(leftID: ID, rightID: ID): ID {
        let depth = 0;
        let interval = 0;
        let newID;
        let lastLeftID, lastRightID;
        while (interval < 2) {
            depth++;
            lastLeftID = this.prefix(leftID, depth);
            lastRightID = this.prefix(rightID, depth);
            interval = this.getInterval(depth, lastLeftID, lastRightID);
        }
        const step = Math.min(this.boundary, interval - 1);

        if (typeof this.strategy[depth] === 'undefined') {
            this.strategy[depth] = this.random.boolean();
        }
        if (this.strategy[depth]) {
            // boundary+ strategy
            const addVal = Math.floor(this.random.range(0, step)) + 1;
            newID = [...lastLeftID];
            newID[newID.length - 1] += addVal;
        } else {
            // boundary- strategy
            const subVal = Math.floor(this.random.range(0, step)) + 1;
            newID = [...lastRightID];
            const newVal = newID[newID.length - 1] - subVal;
            if (newVal < 0) {
                newID[newID.length - 1] = 0;
                this.substractID(newID, newID.length - 1, Math.abs(newVal) - 1);
            } else {
                newID[newID.length - 1] -= subVal;
            }
        }
        return newID;
    }

    /**
     * Compare two positions from id.
     */
    getInterval(depth: number, id1: ID, id2: ID): number {
        return this.getPosition(id2, depth) - this.getPosition(id1, depth);
    }

    /**
     * Get the position of `id` at `depth`.
     */
    getPosition(id: ID, depth: number): number {
        let total = 0;
        for (let i = 0; i < depth - 1; i++) {
            total += id[i] * Math.pow(2, this.base + i);
        }
        total += id[id.length - 1];
        return total;
    }

    /**
     * Modify `id` in place for performance optimization.
     *
     * For example:
     * substract `3` from `[1, 0, 1, 0, 0]` at `depth` `5`
     * return `[1, 0, 0, 128, 0]`
     * @param id
     */
    substractID(id: ID, depth: number, numberToSubstract = 0): void {
        if (depth < 0) {
            return;
        }
        if (depth > 0 && id[depth] === 0) {
            id[depth] = Math.pow(2, this.base + depth) - numberToSubstract;
            this.substractID(id, depth - 1);
        } else {
            id[depth]--;
        }
    }

    /**
     * Prefix the id with depth.
     *
     * For instance:
     * The id [1], prefixed at depth 2 will be [1, 0]
     *
     * @param id
     * @param depth
     */
    prefix(id: ID, depth: number): ID {
        const idCopy = [];
        for (let i = 0; i < depth; i++) {
            if (i < id.length) {
                idCopy.push(id[i]);
            } else {
                idCopy.push(0);
            }
        }
        return idCopy;
    }
}
