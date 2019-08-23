(function () {
'use strict';

const ColorPlugin = we3.getPlugin('Color');

class ForeColorPlugin extends ColorPlugin {
    constructor () {
        super(...arguments);
        this.buttons = {
            template: 'we3.buttons.forecolor',
            active: '_active',
            enabled: '_enabled',
        };
        this._classPrefix = this._classPrefixes && this._classPrefixes.text || 'color-';
        this._styleName = 'color';
    }
}

we3.addPlugin('ForeColor', ForeColorPlugin);

})();
