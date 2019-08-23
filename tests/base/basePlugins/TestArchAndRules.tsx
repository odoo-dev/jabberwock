(function () {
'use strict';

var TestArchAndRules = class extends we3.AbstractPlugin {
    static get autoInstall () {
        return ['Test'];
    }

    constructor () {
        super(...arguments);
        this.dependencies = ['Arch', 'Test'];
        this.doms = [
            {
                name: "Simple p tag, do nothing",
                content: "<p>text</p>",
                test: "<p>text</p>",
            },
            {
                name: "Wrap text and br in p tag",
                content: `
                    aaa,
                    <br>
                    bbb`,
                test: `<p>aaa, <br/>bbb</p>`,
            },
            {
                name: "Auto wrap ul in a ul",
                content: "<ul><ul>text</ul></ul>",
                test: '<ul><li class="o_indent"><ul><li>text</li></ul></li></ul>',
            },
            {
                name: "Keep attribute",
                content: '<font color="red">comment</font>',
                test: '<p><font color="red">comment</font></p>',
            },
            {
                name: "Sort classes",
                content: '<p class="red blue green">comment</p>',
                test: '<p class="blue green red">comment</p>',
            },
            {
                name: "Order inlines",
                content: '<p><u>a<i>b<b>c</b>d</i>e</u></p>',
                test: '<p><u>a</u><i><u>b</u></i><b><i><u>c</u></i></b><i><u>d</u></i><u>e</u></p>',
            },
            {
                name: "Order inlines (2)",
                content: `<p>abc<b>d</b><i>e</i> <u>fghijgl <i><b>mnopq</b></i></u></p>`,
                test: `<p>abc<b>d</b><i>e</i> <u>fghijgl </u><b><i><u>mnopq</u></i></b></p>`,
            },
            {
                name: 'Fix forbidden dom',
                content: '<table><p><p><b>test</b></p></p><p>thing</p></table>',
                test: '<table><tbody><tr><td><p><b>test</b></p></td></tr><tr><td><p>thing</p></td></tr></tbody></table>',

                µ:    '<table><tbody><tr><td><p><b>test</b></p></td></tr><tr><td>thing</td></tr></tbody></table>'
            },
            {
                name: 'Fix forbidden dom (2)',
                content: '<p><b>one</b><p>two</p><i>three</i></p>',
                test: '<p><b>one</b>two<i>three</i></p>' // p within p -> p split, inner p removed
            },
            {
                name: 'Fix forbidden dom (3)',
                content: '<p><b>one</b><u><p>two</p>bis</u><i>three</i></p>',
                test: '<p><b>one</b><u>twobis</u><i>three</i></p>' // p within u -> u split, inner p removed
            },
            {
                name: 'Fix forbidden dom (4)',
                content: '<div><p><b>one</b><p>two</p><i>three</i></p></div>',
                test: '<div><p><b>one</b>two<i>three</i></p></div>'
            },
            {
                name: 'Keep dom without generate forbidden node',
                content: '<p>aaa <a href="/"><i>link</i></a> bbb</p>',
                test: '<p>aaa <a href="/"><i>link</i></a> bbb</p>'
            },
            {
                name: 'Wrap multiple inlines into one p',
                content: '<a href="#a"><b>a</b></a><i><a href="#b">b</a></i><u>c</u><a href="#d">d</a>',
                test: '<p><a href="#a"><b>a</b></a><i><a href="#b">b</a></i><u>c</u><a href="#d">d</a></p>'
            },
            {
                name: 'Allow wrapped and unwrapped links in list items',
                content: '<ul><li><a href="#link">link</a></li><li><p><a href="#p">p</a></p></li></ul>',
                test: '<ul><li><a href="#link">link</a></li><li><p><a href="#p">p</a></p></li></ul>'
            },
            {
                name: "FIX dom with JINJA",
                content: `<section>
                        <div>
                            % if toto:
                            TOTO
                            %end
                        </div>
                    </section>`,
                test: `<section><div>
% if toto:
TOTO
%end
</div></section>`,
            },
            {
                name: "Fix a complex DOM (1)",
                content: '<u><i>A</i></u>b c<i><b> d</b> e <u>F</u></i>;<br>' +
                        '<span>g <font color="red">h <sup>i<b>j</b>k </sup>l ' +
                        '<div><i>m<b>n</b>o</i></div>' +
                        ' p</font>.</span><br>' +
                        '<h1>Q r s, <i>t U v <b>w</b></i> <font color="blue">x y ' +
                        '<span>z</span> 1 2<span class="fa fa-clock"></span></font>,</h1>',
                test: '<p><i><u>A</u></i>b c<b><i> d</i></b><i> e <u>F</u></i>;<br/>' + // respect order and wrap inlines in p
                        '<span>g <font color="red">h <sup>i</sup><b><sup>j</sup></b><sup>k </sup>l ' +
                        '<i>m</i><b><i>n</i></b><i>o</i>' + // block in inline => font split, div removed because inside font
                        ' p</font>.</span><br/><br/></p>' + // two br's to make the first visible
                        '<h1>Q r s, <i>t U v </i><b><i>w</i></b> <font color="blue">x y </font>' +
                        '<span><font color="blue">z</font></span><font color="blue"> 1 2<span class="fa fa-clock"></span></font>,</h1>',
            },
            {
                name: "Fix a complex DOM (2)",
                content: `
                    Bonjour,
                    <br>
                    <i>comment va-<b>tu</b> ?</i>
                    <table><td>wrong TD</td> free text in table</table>
                    <i><font color="red">comment</font> <font color="blue">va-<b>tu</b></font> ?</i>
                    <div>
                        text dans div ?

                        if (div) {
                            console.log('div');
                        }
                    </div>
                    <pre> 
                        if (tata) {
                            console.log('tutu');
                        }

                        <span>OKI</span>
                    </pre>

                    <section>
                        <div>
                            % if toto:
                            TOTO
                            %end
                        </div>
                    </section>
                    <p>
                        <i>iiii</i> <iframe data-src="/test"/> <b>bbb</b>
                    </p>
                `,
                test: '<p>Bonjour, <br/>' +
                      '<i>comment va-</i><b><i>tu</i></b><i> ?</i></p>' + 
                      '<table><tbody><tr><td>wrong TD</td></tr><tr><td>free text in table</td></tr></tbody></table>' +
                      '<p><font color="red"><i>comment</i></font><i> </i><font color="blue"><i>va-</i><b><i>tu</i></b></font><i> ?</i></p>' +
                      "<div>text dans div ? if (div) { console.log('div'); }</div>" +
                      `<pre> 
                        if (tata) {
                            console.log('tutu');
                        }

                        <span>OKI</span>
                    </pre><section><div>
% if toto:
TOTO
%end
</div></section><p><i>iiii</i> <iframe data-src="/test"/> <b>bbb</b></p>`,
            },
        ];
        this.domsArchitecturalSpace = [
            {
                name: "FIX dom with JINJA and add the architectural space",
                content: `<section>
                        <div>
                            % if toto:
                            TOTO
                            %end
                        </div>
                    </section>`,
                test: `<section>
    <div>
        % if toto:TOTO
        %end
    </div>
</section>`, // todo: check if no newline after %if is ok
            },
            {
                name: 'Fix forbidden dom and add the architectural space',
                content: '<table><p><p><b>test</b></p></p><p>thing</p></table>',
                test: '<table>\n' +
                    '    <tbody>\n' +
                    '        <tr>\n' +
                    '            <td>\n' +
                    '                <p><b>test</b></p>\n' +
                    '            </td>\n' +
                    '        </tr>\n' +
                    '        <tr>\n' +
                    '            <td>\n' +
                    '                <p>thing</p>\n' +
                    '            </td>\n' +
                    '        </tr>\n' +
                    '    </tbody>\n' +
                    '</table>',
            },
            {
                name: "Fix a complex DOM and add the architectural space (1)",
                content: '<u><i>A</i></u>b c<i><b> d</b> e <u>F</u></i>;<br>' +
                        '<span>g <font color="red">h <sup>i<b>j</b>k </sup>l ' +
                    '<div><i>m<b>n</b>o</i></div>' +
                    ' p</font>.</span><br>' +
                    '<h1>Q r s, <i>t U v <b>w</b></i> <font color="blue">x y ' +
                        '<span>z</span> 1 2<span class="fa fa-clock"></span></font>,</h1>',
                test: '<p><i><u>A</u></i>b c<b><i> d</i></b><i> e <u>F</u></i>;<br/>' + // respect order and wrap inlines in p
                        '<span>g <font color="red">h <sup>i</sup><b><sup>j</sup></b><sup>k </sup>l ' +
                    '<i>m</i><b><i>n</i></b><i>o</i>' + // block in inline => font split, div removed
                    ' p</font>.</span><br/><br/></p>\n' + // two br's to make the first visible
                    '<h1>Q r s, <i>t U v </i><b><i>w</i></b> <font color="blue">x y </font>' +
                        '<span><font color="blue">z</font></span><font color="blue"> 1 2<span class="fa fa-clock"></span></font>,</h1>',
            },
            {
                name: "Fix a complex DOM and add the architectural space (2)",
                content: `
                    Bonjour,
                    <br>
                    <i>comment va-<b>tu</b> ?</i>
                    <table><td>wrong TD</td> free text in table</table>
                    <i><font color="red">comment</font> <font color="blue">va-<b>tu</b></font> ?</i>
                    <div>
                        text dans div ?

                        if (div) {
                            console.log('div');
                        }
                    </div>
                    <pre> 
                        if (tata) {
                            console.log('tutu');
                        }

                        <span>OKI</span>
                    </pre>

                    <section>
                        <div>
                            % if toto:
                            TOTO
                            %end
                        </div>
                    </section>
                    <p>
                        <i>iiii</i> <iframe data-src="/test"/> <b>bbb</b>
                    </p>
                `,
                test: `<p>Bonjour, <br/><i>comment va-</i><b><i>tu</i></b><i> ?</i></p>
<table>
    <tbody>
        <tr>
            <td>wrong TD</td>
        </tr>
        <tr>
            <td>free text in table</td>
        </tr>
    </tbody>
</table>
<p><font color="red"><i>comment</i></font><i> </i><font color="blue"><i>va-</i><b><i>tu</i></b></font><i> ?</i></p>
<div>text dans div ? if (div) { console.log('div'); }</div>
<pre> 
                        if (tata) {
                            console.log('tutu');
                        }

                        <span>OKI</span>
                    </pre>
<section>
    <div>
        % if toto:TOTO
        %end
    </div>
</section>
<p><i>iiii</i> <iframe data-src="/test"/> <b>bbb</b></p>`, // todo: check if no newline after %if is ok
            },
        ];
    }

    start () {
        this.dependencies.Test.add(this);
        return super.start();
    }

    test (assert) {
        var self = this;
        this.doms.forEach(function (test) {
            self.triggerUp('set_value', {value: test.content});
            var value = self.dependencies.Arch.getValue();
            assert.strictEqual(value, test.test, test.name);
            self.triggerUp('set_value', {value: value});
            var newValue = self.dependencies.Arch.getValue();
            assert.strictEqual(newValue, value, test.name + ' (idempotent)');
        });
        this.domsArchitecturalSpace.forEach(function (test) {
            self.triggerUp('set_value', {value: test.content});
            var value = self.dependencies.Arch.getValue({architecturalSpace: true});
            assert.strictEqual(value, test.test, test.name);
            self.triggerUp('set_value', {value: value});
            var newValue = self.dependencies.Arch.getValue({architecturalSpace: true});
            assert.strictEqual(newValue, value, test.name + ' (idempotent)');
        });
    }
};

we3.addPlugin('TestArchAndRules', TestArchAndRules);

})();
