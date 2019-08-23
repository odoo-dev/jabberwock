(function () {
'use strict';

//--------------------------------------------------------------------------
// Size button
//--------------------------------------------------------------------------

class FloatPlugin extends we3.AbstractPlugin {
    constructor () {
        super(...arguments);
        this.dependencies = ['Arch'];
        this.buttons = {
            template: 'we3.buttons.align',
            active: '_active',
            enabled: '_enabled',
        };
    }
    update (float, archNode) {
        archNode.className.remove('mx-auto pull-right pull-left');
        if (float === 'center') {
            archNode.className.add('mx-auto');
        } else if (float !== 'none') {
            archNode.className.add('pull-' + float);
        }
        this.dependencies.Arch.importUpdate(archNode.toJSON());
    }
    _active (buttonName, focusNode) {
        switch (buttonName) {
            case 'align-left': return focusNode.className.contains('pull-left');
            case 'align-center': return focusNode.className.contains('mx-auto');
            case 'align-right': return focusNode.className.contains('pull-right');
            case 'align-none':  return !(focusNode.className.contains('pull-left') || focusNode.className.contains('mx-auto') || focusNode.className.contains('pull-right'));
        }
    }
    _enabled (buttonName, focusNode) {
        return !focusNode.isText();
    }
}

we3.addPlugin('Float', FloatPlugin);

})();
