(function () {
'use strict';

//--------------------------------------------------------------------------
// Padding button
//--------------------------------------------------------------------------

class PaddingPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch'];
        this.templatesDependencies = ['src/xml/media.xml'];
        this.buttons = {
            template: 'we3.buttons.padding',
            active: '_active',
            enabled: '_enabled',
        };
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    update (value, archNode) {
        archNode.className = archNode.className.toString().replace(/(\s+)?padding-\S+/, '');
        archNode.className.add(value);
        this.dependencies.Arch.importUpdate(archNode.toJSON());
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _active (buttonName, focusNode) {
        return focusNode.className.contains(buttonName);
    }
    _enabled (buttonName, focusNode) {
        return !focusNode.isText();
    }
    _getButtonValues (method) {
        return this.buttons.$el.find('[data-method="' + method + '"][data-value]').map(function () {
            return $(this).attr('[data-value]');
        }).get();
    }
}

we3.addPlugin('Padding', PaddingPlugin);

})();
