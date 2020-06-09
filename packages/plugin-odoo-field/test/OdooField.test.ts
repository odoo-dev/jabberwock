import { expect } from 'chai';
import { describePlugin, testEditor } from '../../utils/src/testUtils';
import { OdooField } from '../../plugin-odoo-field/src/OdooField';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Char } from '../../plugin-char/src/Char';
import JWEditor from '../../core/src/JWEditor';
import { fieldValidators } from '../src/OdooField';

const insertText = async function(editor: JWEditor, text: string): Promise<void> {
    await editor.execCommand<Char>('insertText', {
        text: text,
    });
};

describePlugin(OdooField, () => {
    describe('odoo field validation', () => {
        describe('regex', () => {
            describe('integer', () => {
                it('should be formated as integer', () => {
                    const validPatterns = ['0', '001'];
                    const invalidPatterns = ['', '1a', 'a1', '1a1', '0.1', '0,1'];
                    for (const pattern of validPatterns) {
                        expect(!!pattern.match(fieldValidators.integer)).to.be.true;
                    }
                    for (const pattern of invalidPatterns) {
                        expect(!!pattern.match(fieldValidators.integer)).to.be.false;
                    }
                });
            });
            describe('float and monetary regex', () => {
                it('should be formated as float', () => {
                    const validPatterns = ['0', '001', '0.1', '0,1'];
                    const invalidPatterns = ['', '1a', 'a1', '1a1'];
                    for (const pattern of validPatterns) {
                        expect(!!pattern.match(fieldValidators.float)).to.be.true;
                    }
                    for (const pattern of invalidPatterns) {
                        expect(!!pattern.match(fieldValidators.float)).to.be.false;
                    }
                    for (const pattern of validPatterns) {
                        expect(!!pattern.match(fieldValidators.monetary)).to.be.true;
                    }
                    for (const pattern of invalidPatterns) {
                        expect(!!pattern.match(fieldValidators.monetary)).to.be.false;
                    }
                });
            });
        });
    });

    describe('parser', () => {
        it('should parse an odoo field "text"', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p><span data-oe-expression="odoo_model.text_field" data-oe-field="text_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="text">Sample text</span></p>',
                contentAfter:
                    '<p><span data-oe-expression="odoo_model.text_field" data-oe-field="text_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="text" class="jw-odoo-field">Sample text</span></p>',
            });
        });
        it('should parse an odoo field "html"', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<div data-oe-expression="odoo_model.html_test_field" data-oe-field="html_test_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="html"><h2>Title</h2><p>Content.</p></div>',
                contentAfter:
                    '<div data-oe-expression="odoo_model.html_test_field" data-oe-field="html_test_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="html" class="jw-odoo-field"><h2>Title</h2><p>Content.</p></div>',
            });
        });
        it('should parse an odoo field "integer"', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer">10</span></p>',
                contentAfter:
                    '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer" class="jw-odoo-field">10</span></p>',
            });
        });
        it('should parse an odoo field "float"', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p><span data-oe-expression="odoo_model.float_wigget_duration" data-oe-field="float_wigget_duration" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="float">1,000.0</span></p>',
                contentAfter:
                    '<p><span data-oe-expression="odoo_model.float_wigget_duration" data-oe-field="float_wigget_duration" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="float" class="jw-odoo-field">1,000.0</span></p>',
            });
        });
        it('should parse an odoo field "monetary" with currency symbol on right', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary"><span class="oe_currency_value">1,200,000.00</span>&nbsp;€</span></p>',
                contentAfter:
                    '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary"><span class="oe_currency_value jw-odoo-field">1,200,000.00</span>&nbsp;€</span></p>',
            });
        });
        it('should parse an odoo field "monetary" with currency symbol on left', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary">$&nbsp;<span class="oe_currency_value">1,200,000.00</span></span></p>',
                contentAfter:
                    '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary">$&nbsp;<span class="oe_currency_value jw-odoo-field">1,200,000.00</span></span></p>',
            });
        });

        // TODO: Unskip when the bug of inline will be fixed.
        //       Currently, a span inside another span renders sibling <span>
        //       rather than as parent/child <span>.
        it.skip('should not parse an odoo field "monetary" if no model is provided', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-type="monetary" style="white-space: nowrap;">$&nbsp;<span class="oe_currency_value">1,540,080.00</span></span></p>',
                contentAfter:
                    '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-type="monetary" style="white-space: nowrap;">$&nbsp;<span class="oe_currency_value">1,540,080.00</span></span></p>',
            });
        });
    });

    describe('renderer', () => {
        it('should render the class "jw-odoo-field-invalid" on invalid fields', async () => {
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer">10[]</span></p>',
                    '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer">10</span></p>',
                    '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer">10</span></p>',
                ].join(''),
                stepFunction: async editor => {
                    await insertText(editor, 'a');
                },
                contentAfter: [
                    '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer" class="jw-focus jw-odoo-field jw-odoo-field-invalid">10a[]</span></p>',
                    '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer" class="jw-focus jw-odoo-field jw-odoo-field-invalid">10a</span></p>',
                    '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer" class="jw-focus jw-odoo-field jw-odoo-field-invalid">10a</span></p>',
                ].join(''),
            });
        });
    });

    describe('mirroring', () => {
        describe('odoo field "text"', () => {
            it('should trigger change on all field that share the same ReactiveValue for "text" fields', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: [
                        '<p><span data-oe-expression="odoo_model.text_field" data-oe-field="text_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="text">Sample[] text</span></p>',
                        '<p><span data-oe-expression="odoo_model.text_field" data-oe-field="text_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="text">Sample text</span></p>',
                        '<p><span data-oe-expression="odoo_model.text_field" data-oe-field="text_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="text">Sample text</span></p>',
                    ].join(''),
                    stepFunction: async editor => {
                        await insertText(editor, 'a');
                    },
                    contentAfter: [
                        '<p><span data-oe-expression="odoo_model.text_field" data-oe-field="text_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="text" class="jw-focus jw-odoo-field">Samplea[] text</span></p>',
                        '<p><span data-oe-expression="odoo_model.text_field" data-oe-field="text_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="text" class="jw-focus jw-odoo-field">Samplea text</span></p>',
                        '<p><span data-oe-expression="odoo_model.text_field" data-oe-field="text_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="text" class="jw-focus jw-odoo-field">Samplea text</span></p>',
                    ].join(''),
                });
            });
        });
        describe('odoo field "html"', () => {
            it('should trigger change on all field that share the same ReactiveValue for "text" fields', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: [
                        '<div data-oe-expression="odoo_model.html_test_field" data-oe-field="html_test_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="html"><h2>Title</h2><p>Content[].</p></div>',
                        '<div data-oe-expression="odoo_model.html_test_field" data-oe-field="html_test_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="html"><h2>Title</h2><p>Content.</p></div>',
                        '<div data-oe-expression="odoo_model.html_test_field" data-oe-field="html_test_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="html"><h2>Title</h2><p>Content.</p></div>',
                    ].join(''),
                    stepFunction: async editor => {
                        await insertText(editor, 'a');
                    },
                    contentAfter: [
                        '<div data-oe-expression="odoo_model.html_test_field" data-oe-field="html_test_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="html" class="jw-focus jw-odoo-field"><h2>Title</h2><p>Contenta[].</p></div>',
                        '<div data-oe-expression="odoo_model.html_test_field" data-oe-field="html_test_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="html" class="jw-focus jw-odoo-field"><h2>Title</h2><p>Contenta.</p></div>',
                        '<div data-oe-expression="odoo_model.html_test_field" data-oe-field="html_test_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="html" class="jw-focus jw-odoo-field"><h2>Title</h2><p>Contenta.</p></div>',
                    ].join(''),
                });
            });
        });
        describe('odoo field "integer"', () => {
            it('should trigger change on all field that share the same ReactiveValue for "integer" fields', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: [
                        '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer">10[]</span></p>',
                        '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer">10</span></p>',
                        '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer">10</span></p>',
                    ].join(''),
                    stepFunction: async editor => {
                        await insertText(editor, '0');
                    },
                    contentAfter: [
                        '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer" class="jw-focus jw-odoo-field">100[]</span></p>',
                        '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer" class="jw-focus jw-odoo-field">100</span></p>',
                        '<p><span data-oe-expression="odoo_model.integer_field" data-oe-field="integer_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="integer" class="jw-focus jw-odoo-field">100</span></p>',
                    ].join(''),
                });
            });
        });
        describe('odoo field "float"', () => {
            it('should trigger change on all field that share the same ReactiveValue for "float" fields', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: [
                        '<p><span data-oe-expression="odoo_model.float_wigget_duration" data-oe-field="float_wigget_duration" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="float">1,000[].0</span></p>',
                        '<p><span data-oe-expression="odoo_model.float_wigget_duration" data-oe-field="float_wigget_duration" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="float">1,000.0</span></p>',
                        '<p><span data-oe-expression="odoo_model.float_wigget_duration" data-oe-field="float_wigget_duration" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="float">1,000.0</span></p>',
                    ].join(''),
                    stepFunction: async editor => {
                        await insertText(editor, '0');
                    },
                    contentAfter: [
                        '<p><span data-oe-expression="odoo_model.float_wigget_duration" data-oe-field="float_wigget_duration" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="float" class="jw-focus jw-odoo-field">1,0000[].0</span></p>',
                        '<p><span data-oe-expression="odoo_model.float_wigget_duration" data-oe-field="float_wigget_duration" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="float" class="jw-focus jw-odoo-field">1,0000.0</span></p>',
                        '<p><span data-oe-expression="odoo_model.float_wigget_duration" data-oe-field="float_wigget_duration" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="float" class="jw-focus jw-odoo-field">1,0000.0</span></p>',
                    ].join(''),
                });
            });
        });
        describe('odoo field "monetary"', () => {
            it('should trigger change on all field that share the same ReactiveValue for "monetary" fields', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: [
                        '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary"><span class="oe_currency_value">1,200,000[].00</span>&nbsp;€</span></p>',
                        '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary"><span class="oe_currency_value">1,200,000.00</span>&nbsp;€</span></p>',
                        '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary"><span class="oe_currency_value">1,200,000.00</span>&nbsp;€</span></p>',
                    ].join(''),
                    stepFunction: async editor => {
                        await insertText(editor, '0');
                    },
                    contentAfter: [
                        '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary"><span class="oe_currency_value jw-focus jw-odoo-field">1,200,0000[].00</span>&nbsp;€</span></p>',
                        '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary"><span class="oe_currency_value jw-focus jw-odoo-field">1,200,0000.00</span>&nbsp;€</span></p>',
                        '<p><span data-oe-expression="odoo_model.monetary_field" data-oe-field="monetary_field" data-oe-id="1" data-oe-model="odoo_module.odoo_model" data-oe-type="monetary"><span class="oe_currency_value jw-focus jw-odoo-field">1,200,0000.00</span>&nbsp;€</span></p>',
                    ].join(''),
                });
            });
        });
    });
});
