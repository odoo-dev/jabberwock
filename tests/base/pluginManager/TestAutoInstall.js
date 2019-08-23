(function () {
'use strict';

// insure that the auto installation of the modules happen
// if this plugin is not installed

var TestAutoInstall = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Test'];
    }
    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }
    test () {
        return Promise.resolve();
    }
};

we3.addPlugin('TestAutoInstall', TestAutoInstall);

})();
