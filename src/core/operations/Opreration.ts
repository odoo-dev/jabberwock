export class Operation {
    id: number;

    constructor(id: number) {
        this.id = id;
        this.offset = offset;
    }

    _getToken(): any {
        return {
            id: this._generateID(),
            // site: this._getSite(), // for later
        };
    }

    // _getSite(): string {
    //     return 'site';
    // }

    _generateID(): string {
        return '1';
    }
}
