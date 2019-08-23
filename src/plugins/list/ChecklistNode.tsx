(function () {
'use strict';

// Custom node representing a checklist (default: ul.o_checklist)
class ChecklistNode extends we3.ListNode {
    /**
     * @override
     */
    static parse (archNode) {
        var checklistInfo = archNode.params.options.list && archNode.params.options.list.checklist;
        var checklistClass = checklistInfo && checklistInfo.className;
        var hasChecklistClass = checklistClass && archNode.className && archNode.className.contains(checklistClass);
        if (archNode.nodeName === 'checklist' || hasChecklistClass || archNode.isList() && archNode.isInChecklist && archNode.isInChecklist()) {
            if (checklistClass && !hasChecklistClass) {
                archNode.className.add(checklistClass);
            }
            var checklist = new ChecklistNode(archNode.params, 'ul', archNode.attributes.toJSON());
            var fragment = archNode._fragmentWithChildren(archNode.childNodes);
            checklist.append(fragment);
            return checklist;
        }
    }
    /**
     * @returns {boolean}
     */
    isChecklist () {
        return true;
    }
    /**
     * Get the list's type (checklist)
     *
     * @returns {string}
     */
    get listType () {
        return 'checklist';
    }
    /**
     * @override
     */
    get type () {
        return 'CHECKLIST';
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Get the class to apply to checklists from the options, if any
     *
     * @private
     * @returns {string|undefined}
     */
    get _checklistClass () {
        var checklistInfo = this.params.options.list && !this.params.options.list.checklist;
        return checklistInfo && checklistInfo.className;
    }
}

we3.addArchNode('CHECKLIST', ChecklistNode);

})();
