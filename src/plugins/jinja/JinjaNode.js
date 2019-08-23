(function () {
'use strict';

const regex = we3.utils.regex.Jinja;

class JinjaNode extends we3.ArchNodeText {
    //--------------------------------------------------------------------------
    // static
    //--------------------------------------------------------------------------

    static parse (archNode) {
        if (archNode.isText() && regex.jinjaExp.test(archNode.nodeValue)) {
            return JinjaNode._splitTextArchNode(archNode);
        }
    }
    static _splitTextArchNode (archNode) {
        var fragment = new we3.ArchNodeFragment(archNode.params);
        archNode.nodeValue.trim().split('\n').forEach(function (line) {
            fragment.append(new JinjaNode(archNode.params, null, null, '\n'));
            if (regex.jinjaLineExp.test(line)) {
                fragment.append(new JinjaNode(archNode.params, null, null, line.trim()));
            } else {
                fragment.append(new we3.ArchNodeText(archNode.params, null, null, line.trim()));
            }
        });
        fragment.append(new JinjaNode(archNode.params, null, null, '\n'));
        return fragment;
    }

    //--------------------------------------------------------------------------
    // public
    //--------------------------------------------------------------------------

    isBlock () {
        return true;
    }
    isInPre () {
        return true;
    }
    isJinja () {
        return true;
    }
    get type () {
        return 'JINJA';
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _addArchitecturalSpaceNode () {
        this.nodeValue = this.nodeValue.replace(/^\n|\n$/g, '');
        if (!this.nodeValue.length) {
            if (this.isRightEdge()) {
                this.after(this.params.create('ArchitecturalSpace'));
            }
            return;
        }
        if (this.__removed || !this.parent || this._hasArchitecturalSpace) {
            return;
        }

        var self = this;
        this.params.bypassUpdateConstraints(function () {
            self.before(self.params.create('ArchitecturalSpace'));
            if (self.isRightEdge()) {
                self.after(self.params.create('ArchitecturalSpace'));
            }
        });
        this._hasArchitecturalSpace = true;
    }
    _applyRulesArchNode () {
        return;
    }
    _getParentedRules () {
        var parentedRules = super._getParentedRules();
        parentedRules.push({
            nodes: {
                methods: ['isJinja'],
            },
            permittedParents: {
                methods: ['isNotText'],
            }
        });
        return parentedRules;
    }
}

we3.addArchNode('JINJA', JinjaNode);

})();
