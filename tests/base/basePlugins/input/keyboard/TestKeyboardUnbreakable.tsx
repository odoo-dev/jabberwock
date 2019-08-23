(function () {
'use strict';

var NOTEDITABLE = class extends we3.ArchNode {
    static parse (archNode) {
        if (archNode.nodeName === 'noteditable') {
            return new NOTEDITABLE(archNode.params, archNode.nodeName, archNode.attributes.toJSON());
        }
    }
    get type () {
        return 'NOTEDITABLE';
    }
    isBlock () {
        return true;
    }
    isEditable () {
        return false;
    }
    isTestEditable () {
        return true;
    }
};
we3.addArchNode('NOTEDITABLE', NOTEDITABLE);

var EDITABLE = class extends we3.ArchNode {
    static parse (archNode) {
        if (archNode.nodeName === 'editable') {
            return new EDITABLE(archNode.params, archNode.nodeName, archNode.attributes.toJSON());
        }
    }
    get type () {
        return 'EDITABLE';
    }
    isBlock () {
        return true;
    }
    isEditable () {
        return true;
    }
    isTestEditable () {
        return true;
    }
};
we3.addArchNode('EDITABLE', EDITABLE);

var TestKeyboardUnbreakable = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['TestKeyboard'];
    }
    constructor () {
        super(...arguments);
        this.dependencies = ['Rules', 'Test', 'TestKeyboard'];

        // range collapsed: ◆
        // range start: ▶
        // range end: ◀

        this.keyboardTests = [{
                name: "nothing to do",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="c">' +
                    '            <p>c▶on◀tent_c_0</p>' +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>' +
                    '            <noteditable id="e">' +
                    '                <p>content_e_0</p>' +
                    '                <editable id="f"><p>content_f_0</p></editable>' +
                    '                <p>content_e_1</p>' +
                    '            </noteditable>' +
                    '            <p>content_c_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '<noteditable id="a">' +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="c">'.trim() +
                    '            <p>c▶on◀tent_c_0</p>'.trim() +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>'.trim() +
                    '            <noteditable id="e">'.trim() +
                    '                <p>content_e_0</p>'.trim() +
                    '                <editable id="f"><p>content_f_0</p></editable>'.trim() +
                    '                <p>content_e_1</p>'.trim() +
                    '            </noteditable>'.trim() +
                    '            <p>content_c_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "nothing to do 2",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="j">' +
                    '            <p>c▶ontent_j_0</p>' +
                    '            <editable id="k"><p>content_k_0</p></editable>' +
                    '            <editable id="l"><p>conte◀nt_l_0</p></editable>' +
                    '            <p>content_j_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="j">'.trim() +
                    '            <p>c▶ontent_j_0</p>'.trim() +
                    '            <editable id="k"><p>content_k_0</p></editable>'.trim() +
                    '            <editable id="l"><p>conte◀nt_l_0</p></editable>'.trim() +
                    '            <p>content_j_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "nothing to do 3",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="j">' +
                    '            <p>content_j_0</p>' +
                    '            <editable id="k"><p>con▶tent_k_0</p></editable>' +
                    '            <editable id="l"><p>conte◀nt_l_0</p></editable>' +
                    '            <p>content_j_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="j">'.trim() +
                    '            <p>content_j_0</p>'.trim() +
                    '            <editable id="k"><p>con▶tent_k_0</p></editable>'.trim() +
                    '            <editable id="l"><p>conte◀nt_l_0</p></editable>'.trim() +
                    '            <p>content_j_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "find the first allowed node",
                content: '    <noteditable id="a">' +
                    '        <p>conte◆nt_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="c">' +
                    '            <p>content_c_0</p>' +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>' +
                    '            <noteditable id="e">' +
                    '                <p>content_e_0</p>' +
                    '                <editable id="f"><p>content_f_0</p></editable>' +
                    '                <p>content_e_1</p>' +
                    '            </noteditable>' +
                    '            <p>content_c_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="c">'.trim() +
                    '            <p>◆content_c_0</p>'.trim() +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>'.trim() +
                    '            <noteditable id="e">'.trim() +
                    '                <p>content_e_0</p>'.trim() +
                    '                <editable id="f"><p>content_f_0</p></editable>'.trim() +
                    '                <p>content_e_1</p>'.trim() +
                    '            </noteditable>'.trim() +
                    '            <p>content_c_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "find the first allowed node and collapse the selection",
                content: '    <noteditable id="a">' +
                '        <p>co▶ntent_a_0</p>' +
                '        <noteditable id="b"><p>con◀tent_b_0</p></noteditable>' +
                '        <editable id="c">' +
                '            <p>content_c_0</p>' +
                '            <noteditable id="d"><p>content_d_0</p></noteditable>' +
                '            <noteditable id="e">' +
                '                <p>content_e_0</p>' +
                '                <editable id="f"><p>content_f_0</p></editable>' +
                '                <p>content_e_1</p>' +
                '            </noteditable>' +
                '            <p>content_c_4</p>' +
                '        </editable>' +
                '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                '        <p>content_a_0</p>'.trim() +
                '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                '        <editable id="c">'.trim() +
                '            <p>◆content_c_0</p>'.trim() +
                '            <noteditable id="d"><p>content_d_0</p></noteditable>'.trim() +
                '            <noteditable id="e">'.trim() +
                '                <p>content_e_0</p>'.trim() +
                '                <editable id="f"><p>content_f_0</p></editable>'.trim() +
                '                <p>content_e_1</p>'.trim() +
                '            </noteditable>'.trim() +
                '            <p>content_c_4</p>'.trim() +
                '        </editable>'.trim() +
                '    </noteditable>'.trim(),
            },
            {
                name: "resize the range to the allowed end",
                content: '    <noteditable id="a">' +
                    '        <p>co▶ntent_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="c">' +
                    '            <p>co◀ntent_c_0</p>' +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>' +
                    '            <noteditable id="e">' +
                    '                <p>content_e_0</p>' +
                    '                <editable id="f"><p>content_f_0</p></editable>' +
                    '                <p>content_e_1</p>' +
                    '            </noteditable>' +
                    '            <p>content_c_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="c">'.trim() +
                    '            <p>▶co◀ntent_c_0</p>'.trim() +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>'.trim() +
                    '            <noteditable id="e">'.trim() +
                    '                <p>content_e_0</p>'.trim() +
                    '                <editable id="f"><p>content_f_0</p></editable>'.trim() +
                    '                <p>content_e_1</p>'.trim() +
                    '            </noteditable>'.trim() +
                    '            <p>content_c_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "resize the range to the allowed start",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="c">' +
                    '            <p>con▶tent_c_0</p>' +
                    '            <noteditable id="d"><p>cont◀ent_d_0</p></noteditable>' +
                    '            <noteditable id="e">' +
                    '                <p>content_e_0</p>' +
                    '                <editable id="f"><p>content_f_0</p></editable>' +
                    '                <p>content_e_1</p>' +
                    '            </noteditable>' +
                    '            <p>content_c_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="c">'.trim() +
                    '            <p>con▶tent_c_0◀</p>'.trim() +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>'.trim() +
                    '            <noteditable id="e">'.trim() +
                    '                <p>content_e_0</p>'.trim() +
                    '                <editable id="f"><p>content_f_0</p></editable>'.trim() +
                    '                <p>content_e_1</p>'.trim() +
                    '            </noteditable>'.trim() +
                    '            <p>content_c_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "resize the range (containing noteditable node) to the allowed node",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <noteditable id="g"><p>conte▶nt_g_0</p></noteditable>' +
                    '        <editable id="h">' +
                    '            <p>con◀tent_h_0</p>' +
                    '            <noteditable id="i"><p>content_i_0</p></noteditable>' +
                    '            <p>content_h_2</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <noteditable id="g"><p>content_g_0</p></noteditable>'.trim() +
                    '        <editable id="h">'.trim() +
                    '            <p>▶con◀tent_h_0</p>'.trim() +
                    '            <noteditable id="i"><p>content_i_0</p></noteditable>'.trim() +
                    '            <p>content_h_2</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "resize the range to the allowed node between the start and the end",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="c">' +
                    '            <p>content_c_0</p>' +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>' +
                    '            <noteditable id="e">' +
                    '                <p>▶content_e_0</p>' +
                    '                <editable id="f"><p>content_f_0</p></editable>' +
                    '                <p>content_e_1</p>' +
                    '            </noteditable>' +
                    '            <p>content_c_4◀</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="c">'.trim() +
                    '            <p>content_c_0</p>'.trim() +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>'.trim() +
                    '            <noteditable id="e">'.trim() +
                    '                <p>content_e_0</p>'.trim() +
                    '                <editable id="f"><p>▶content_f_0◀</p></editable>'.trim() +
                    '                <p>content_e_1</p>'.trim() +
                    '            </noteditable>'.trim() +
                    '            <p>content_c_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "resize the range to the allowed start with the entirety of the noteditable node",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="c">' +
                    '            <p>con▶tent_c_0</p>' +
                    '            <noteditable id="d"><p>cont◀ent_d_0</p></noteditable>' +
                    '            <noteditable id="e">' +
                    '                <p>◀content_e_0</p>' +
                    '                <editable id="f"><p>content_f_0</p></editable>' +
                    '                <p>content_e_1</p>' +
                    '            </noteditable>' +
                    '            <p>content_c_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="c">'.trim() +
                    '            <p>con▶tent_c_0◀</p>'.trim() +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>'.trim() +
                    '            <noteditable id="e">'.trim() +
                    '                <p>content_e_0</p>'.trim() +
                    '                <editable id="f"><p>content_f_0</p></editable>'.trim() +
                    '                <p>content_e_1</p>'.trim() +
                    '            </noteditable>'.trim() +
                    '            <p>content_c_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "resize the range to the allowed start and delete content",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="c">' +
                    '            <p>con▶tent_c_0</p>' +
                    '            <noteditable id="d"><p>cont◀ent_d_0</p></noteditable>' +
                    '            <noteditable id="e">' +
                    '                <p>content_e_0</p>' +
                    '                <editable id="f"><p>content_f_0</p></editable>' +
                    '                <p>content_e_1</p>' +
                    '            </noteditable>' +
                    '            <p>content_c_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                steps: [{
                    key: "DELETE",
                }],
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="c">'.trim() +
                    '            <p>con◆</p>'.trim() +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>'.trim() +
                    '            <noteditable id="e">'.trim() +
                    '                <p>content_e_0</p>'.trim() +
                    '                <editable id="f"><p>content_f_0</p></editable>'.trim() +
                    '                <p>content_e_1</p>'.trim() +
                    '            </noteditable>'.trim() +
                    '            <p>content_c_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "delete noteditable nodes in a editable",
                content: '    <noteditable id="a">' +
                    '        <p>content_a_0</p>' +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>' +
                    '        <editable id="c">' +
                    '            <p>con▶tent_c_0</p>' +
                    '            <noteditable id="d"><p>content_d_0</p></noteditable>' +
                    '            <noteditable id="e">' +
                    '                <p>content_e_0</p>' +
                    '                <editable id="f"><p>content_f_0</p></editable>' +
                    '                <p>content_e_1</p>' +
                    '            </noteditable>' +
                    '            <p>content◀_c_4</p>' +
                    '        </editable>' +
                    '    </noteditable>',
                steps: [{
                    key: "DELETE",
                }],
                test: '    <noteditable id="a">'.trim() +
                    '        <p>content_a_0</p>'.trim() +
                    '        <noteditable id="b"><p>content_b_0</p></noteditable>'.trim() +
                    '        <editable id="c">'.trim() +
                    '            <p>con◆_c_4</p>'.trim() +
                    '        </editable>'.trim() +
                    '    </noteditable>'.trim(),
            },
            {
                name: "select range with 2 nodes on the root",
                content: '<editable id="m"><p>conte▶nt_m_0</p></editable>' +
                    '<editable id="n"><p>conte◀nt_n_0</p></editable>',
                test: '<editable id="m"><p>conte▶nt_m_0</p></editable>' +
                    '<editable id="n"><p>conte◀nt_n_0</p></editable>',
            },
            /* TODO: fix... This test can't be reproduced manually so what is it supposed to simulate?
            {
                name: "'a' on begin of a span with fake_editable",
                content:
                    '<div class="o_fake_not_editable" contentEditable="false">\n' +
                    '   <div>\n' +
                    '     <label>\n' +
                    '       <input type="checkbox"/>\n' +
                    '       <span class="o_fake_editable" contentEditable="true">\n' +
                    '         dom to edit\n' +
                    '       </span>\n' +
                    '     </label>\n' +
                    '   </div>\n' +
                    '</div>',
                steps: [{
                    key: 'a',
                }],
                test: {
                    content:
                        '<div>\n' +
                        '   <div>\n' +
                        '     <label>\n' +
                        '       <input type="checkbox">\n' +
                        '       <span>\n' +
                        '         adom to edit\n' +
                        '       </span>\n' +
                        '     </label>\n' +
                        '   </div>\n' +
                        '</div>',
                },
            },
            */
            {
                name: "'a' in unbreakable with font",
                content: '<div class="unbreakable"><p>dom <span class="fa fa-heart"></span>to◆ edit</p></div>',
                steps: [{
                    key: 'a',
                }],
                test: '<div class="unbreakable"><p>dom <span class="fa fa-heart"></span>toa◆ edit</p></div>',
            },
            {
                name: "'a' on begin of unbreakable inline node",
                content: '<p>dom <strong class="unbreakable">◆to</strong> edit</p>',
                steps: [{
                    key: 'a',
                }],
                test: '<p>dom <strong class="unbreakable">a◆to</strong> edit</p>',
            },
            {
                name: "'a' on end of unbreakable inline node",
                content: '<div><p>dom <strong class="unbreakable">to◆</strong> edit</p></div>',
                steps: [{
                    key: 'a',
                }],
                test: '<div><p>dom <strong class="unbreakable">toa◆</strong> edit</p></div>',
            },
            {
                name: "'1' on begin of value of a field currency",
                content:
                    '<noteditable>\n' +
                        '<p><b data-oe-type="monetary" class="oe_price editable">$&nbsp;<span class="oe_currency_value">◆750.00</span></b></p>\n' +
                    '</noteditable>',
                steps: [{
                    key: '1',
                }],
                test: '<noteditable>' +
                        '<p><b data-oe-type="monetary" class="editable oe_price">$ <span class="oe_currency_value">1◆750.00</span></b></p>' +
                    '</noteditable>',
            },
            {
                name: "'1' on end of value of a field currency",
                content:
                    '<noteditable>\n' +
                        '<p><b data-oe-type="monetary" class="oe_price editable">$&nbsp;<span class="oe_currency_value">750.00◆</span></b></p>\n' +
                    '</noteditable>',
                steps: [{
                    key: '1',
                }],
                test: '<noteditable>' +
                        '<p><b data-oe-type="monetary" class="editable oe_price">$ <span class="oe_currency_value">750.001◆</span></b></p>' +
                    '</noteditable>',
            },
            {
                name: "'1' on begin of editable in noteditable",
                content:
                    '<noteditable>\n' +
                        '<p><b data-oe-type="monetary" class="oe_price editable">$&nbsp;<span class="oe_currency_value">◆750.00</span></b></p>\n' +
                    '</noteditable>',
                steps: [{
                    key: '1',
                }],
                test:   '<noteditable>' +
                            '<p><b data-oe-type="monetary" class="editable oe_price">$ <span class="oe_currency_value">1◆750.00</span></b></p>' +
                        '</noteditable>',
            },
            /* {
                name: "'1' on end of editable in noteditable",
                content:
                    '<noteditable>\n' +
                        '<b data-oe-type="monetary" class="oe_price editable">$&nbsp;<span class="oe_currency_value">750.00</span></b>\n' +
                    '</noteditable>',
                steps: [{
                    key: '1',
                }],
                test:   '<noteditable>\n' +
                            '<b data-oe-type="monetary" class="oe_price editable">$&nbsp;<span class="oe_currency_value">750.001◆</span></b>\n' +
                        '</noteditable>',
            },
            {
                name: "'a' on editable with before&after in noteditable",
                content:
                    '<style>#test-before-after:before { content: "placeholder";} #test-before-after:after { content: "\\00a0";}</style>\n' +
                    '<noteditable>\n' +
                        '<b id="test-before-after" class="editable"></b>\n' +
                    '</noteditable>',
                steps: [{
                    key: 'a',
                }],
                test:   '<style>#test-before-after:before { content: "placeholder";} #test-before-after:after { content: "\\00a0";}</style>\n' +
                        '<noteditable>\n' +
                            '<b id="test-before-after" class="editable">a◆</b>\n' +
                        '</noteditable>',
            }, */
        ];
    }

    start () {
        this.dependencies.Test.add(this);

        this.dependencies.Rules.addStructureRule({
            nodes: {
                nodeNames: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre'],
            },
            permittedParents: {
                methods: ['isTestEditable'],
            },
        });
        return super.start();
    }

    test (assert) {
        return this.dependencies.TestKeyboard.test(assert, this.keyboardTests);
    }
};

we3.addPlugin('TestKeyboardUnbreakable', TestKeyboardUnbreakable);

})();
