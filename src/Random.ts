export class Random {
    _seed: number;

    constructor(seed?: number) {
        if (seed == null) {
            if (seed === null) this.random = Math.random;
            this._seed = (Math.random() * 2147483647) | 0;
        } else {
            this._seed = seed | 0;
        }
        this.seed();
    }
    seed(): number {
        return (this._seed = ((this._seed + 1) * 36873) % 2147483647 | 0);
    }
    random(): number {
        return this.seed() / 2147483647;
    }
    boolean(): boolean {
        return this.random() >= 0.5;
    }
    range(min: number, max: number): number {
        return min + this.random() * (max - min);
    }
}
