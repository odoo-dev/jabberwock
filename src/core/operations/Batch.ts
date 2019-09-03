import { Operation } from './Opreration';
export class Batch {
    operations: Operation[];

    constructor(operations = []) {
        this.operations = operations;
    }
}
