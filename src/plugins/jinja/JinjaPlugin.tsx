(function () {
'use strict';

const regex = we3.utils.regex.Jinja;

class JinjaPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'CodeView'];
    }

    /**
     * @overwrite
     */
    setEditorValue () {
        var value = this.dependencies.Arch.getValue();
        if (regex.jinjaExp.test(value)) {
            this.dependencies.CodeView.active(value);
        }
    }
}

we3.addPlugin('Jinja', JinjaPlugin);

})();
