const testEdition = function(nothingYet) {

}

describe('test the rendrer', function () {
    it('should no change', function () {
        testEdition({
            content: "<p><b>dom to edit◆</b></p>",
            steps: [],
            test: "<p><b>dom to edit◆</b></p>",
            testDOM: "<p><b>dom to edit</b></p>",
        });
        expect(true).toBe(true);
    });

    it('ENTER at the end of b in p', function () {
        testEdition({
            content: "<p><b>dom to edit◆</b></p>",
            steps: [{
                key: 'Enter',
            }],
            test: "<p><b>dom to edit</b></p><p>▶<br/>◀</p>",
            testDOM: "<p><b>dom to edit</b></p><p><br></p>",
        });
    });

    it("ENTER after click bold, at the end of b in p", function () {
        testEdition({
            content: "<p>▶dom to edit◀</p><p>other content</p>",
            steps: [{
                do:  async function () {
                    // var p = self.editable.querySelector('test-container p');
                    // var bold = self.editor.querySelector('we3-button[data-method="formatText"][data-value="b"]');
                    // await self.dependencies.Test.triggerNativeEvents(bold, ['mousedown', 'click', 'mouseup']);
                    // await self.dependencies.Test.setRangeFromDOM(p.lastChild, 1);
                }
            }, {
                key: 'Enter',
            }],
            test: '<p><b>dom to edit</b></p><p>▶<br/>◀</p><p>other content</p>',
            testDOM: '<p><b>dom to edit</b></p><p><br></p><p>other content</p>',
        });
    });
})
