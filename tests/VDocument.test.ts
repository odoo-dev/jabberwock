import VDocument from '../src/core/stores/VDocument';
describe('VDocument', function() {
    describe('insert', function() {
        it('insert-char', function() {
            const vdocument = new VDocument();
            vdocument.insertChar('a');
        });
    });
});
