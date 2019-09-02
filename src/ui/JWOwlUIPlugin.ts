import { Component } from '../../lib/owl/dist/owl.js';

export class JWOwlUIPlugin {
    templates: string
    componentsRegistry: typeof Component []

    constructor () {
        this.componentsRegistry = [];
    }
}
