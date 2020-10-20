import { expect } from 'chai';
import { removeFormattingSpace } from '../src/formattingSpace';

/**
 * @param {String} html representing any number of sibling elements
 * @return {NodeList}
 */
const htmlToElements = (html: string, debug = false): NodeList => {
    if (debug) console.log('html String = ', html);
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.childNodes;
};

describe('removeFormattingSpace() util function', () => {
    describe('only child node', () => {
        it('Should return trimmed text when no space are around text', async () => {
            const nodes = htmlToElements('<p><a>abc</a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when one space before and after text', async () => {
            const nodes = htmlToElements('<p><a> abc </a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiples spaces before and after text', async () => {
            const nodes = htmlToElements('<p><a>  abc  </a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiple spaces after text', async () => {
            const nodes = htmlToElements('<p><a>abc   </a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiple spaces before text', async () => {
            const nodes = htmlToElements('<p><a>   abc</a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when spaces and line breaks around text', async () => {
            const nodes = htmlToElements(`<p><a>  
     abc  
     </a></p>`);
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when spaces and line breaks after text', async () => {
            const nodes = htmlToElements(`<p><a>abc
     </a></p>`);
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when spaces and line breaks before text', async () => {
            const nodes = htmlToElements(`<p><a>
     abc</a></p>`);
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiples spaces before and after node', async () => {
            const nodes = htmlToElements('<p>    <a>abc</a>    </p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiple spaces after node', async () => {
            const nodes = htmlToElements('<p><a>abc</a>   </p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiple spaces before node', async () => {
            const nodes = htmlToElements('<p>   <a>abc</a></p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiples spaces before and after node and text', async () => {
            const nodes = htmlToElements('<p>    <a>  abc  </a>    </p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiples spaces and line breaks before and after node and text', async () => {
            const nodes = htmlToElements(`<p> 
    <a>  abc  </a>  
</p>`);
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiple spaces after both nodes (alt)', async () => {
            const nodes = htmlToElements('<p><a>abc</a>   </p>   ');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiple spaces before both node (alt)', async () => {
            const nodes = htmlToElements('   <p>   <a>abc</a></p>');
            expect(removeFormattingSpace(nodes[1].childNodes[1].firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiples spaces and line breaks before and after node and text (alt)', async () => {
            const nodes = htmlToElements(`
  <p> 
    <a>  abc  </a>  
  </p>
`);
            expect(removeFormattingSpace(nodes[1].childNodes[1].firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiples spaces and line breaks before and after node and text (alt 2)', async () => {
            const nodes = htmlToElements(`   
     <p>    
    <a>  abc  </a>  
  </p>   
    `);
            expect(removeFormattingSpace(nodes[1].childNodes[1].firstChild)).to.equal('abc');
        });
        it('Should return trimmed text when multiples spaces and line breaks before and after node and text (alt 3)', async () => {
            const nodes = htmlToElements(`   
                <p>    
                <a>  
                abc  
                </a>  
                </p>   
                `);
            expect(removeFormattingSpace(nodes[1].childNodes[1].firstChild)).to.equal('abc');
        });
        it('Should preserve a space before a line break at the end of a paragraph', async () => {
            const nodes = htmlToElements('<p>abc <br><br></p>');
            expect(removeFormattingSpace(nodes[0].firstChild)).to.equal('abc ');
        });
    });
    describe('nodes with multiple children', () => {
        // see : https://jsfiddle.net/5fzexc6L/9/ for examples clarifying where whitespace should be preserved.
        it('Should return trimmed text when no space around text', async () => {
            const nodes = htmlToElements('<p><a>abc</a><a>def</a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'abc',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal(
                'def',
                'test #2',
            );
        });
        it('Should return mostly trimmed text when spaces around text', async () => {
            const nodes = htmlToElements('<p><a>  abc  </a><a>  def  </a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'abc ',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal(
                'def',
                'test #2',
            );
        });
        it('Should return mostly trimmed text when spaces around text and between node', async () => {
            const nodes = htmlToElements('<p><a>  abc  </a>  <a>  def  </a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'abc ',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[2].firstChild)).to.equal(
                'def',
                'test #2',
            );
        });
        it('Should return trimmed text when spaces between node', async () => {
            const nodes = htmlToElements('<p><a>abc</a>  <a>def</a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'abc',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[2].firstChild)).to.equal(
                'def',
                'test #2',
            );
        });
        it('Should return trimmed text when spaces around and inside text', async () => {
            const nodes = htmlToElements('<p><a> ab  c </a><a> d  ef </a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'ab c ',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal(
                'd ef',
                'test #2',
            );
        });
        it('Should return trimmed text when spaces around text and node and inside text', async () => {
            const nodes = htmlToElements('<p>  <a>  ab  c  </a>  <a>  d  ef  </a>  </p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1])).to.equal('ab c ', 'test #1');
            expect(removeFormattingSpace(nodes[0].childNodes[3])).to.equal('d ef', 'test #2');
        });
        it('Should return trimmed text when spaces around text and node and inside text (2)', async () => {
            const nodes = htmlToElements('<p>  <a>  ab  c</a>  <a>  d  ef  </a>  </p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1])).to.equal('ab c', 'test #1');
            expect(removeFormattingSpace(nodes[0].childNodes[3])).to.equal('d ef', 'test #2');
        });
        it('Should return trimmed text when spaces around text and node and inside text (3)', async () => {
            const nodes = htmlToElements('<p>  <a>  ab  c</a><a>  d  ef  </a>  </p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1])).to.equal('ab c', 'test #1');
            expect(removeFormattingSpace(nodes[0].childNodes[2])).to.equal(' d ef', 'test #2');
        });
        it('Should return trimmed text when spaces and line break around text and node and inside text', async () => {
            const nodes = htmlToElements(
                `
<p>
    <a> ab  c </a>
    <a> d  ef </a>
</p>
`,
            );
            expect(removeFormattingSpace(nodes[1].childNodes[1].firstChild)).to.equal('ab c ');
            expect(removeFormattingSpace(nodes[1].childNodes[3].firstChild)).to.equal('d ef');
        });
    });
    describe('nodes with multiple children (with tabs)', () => {
        it('Should return mostly trimmed text when tabs around text', async () => {
            const nodes = htmlToElements('<p><a>		abc		</a><a>		def		</a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'abc ',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal(
                'def',
                'test #2',
            );
        });
        it('Should return mostly trimmed text when tabs around text and between node', async () => {
            const nodes = htmlToElements('<p><a>		abc		</a>		<a>		def		</a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'abc ',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[2].firstChild)).to.equal(
                'def',
                'test #2',
            );
        });
        it('Should return trimmed text when tabs between node', async () => {
            const nodes = htmlToElements('<p><a>abc</a>		<a>def</a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'abc',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[2].firstChild)).to.equal(
                'def',
                'test #2',
            );
        });
        it('Should return trimmed text when tabs around and inside text', async () => {
            const nodes = htmlToElements('<p><a>	ab		c	</a><a>	d		ef	</a></p>');
            expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal(
                'ab c ',
                'test #1',
            );
            expect(removeFormattingSpace(nodes[0].childNodes[1].firstChild)).to.equal(
                'd ef',
                'test #2',
            );
        });
        it('Should return trimmed text when tabs around text and node and inside text', async () => {
            const nodes = htmlToElements('<p>		<a>		ab		c		</a>		<a>		d		ef		</a>		</p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1])).to.equal('ab c ', 'test #1');
            expect(removeFormattingSpace(nodes[0].childNodes[3])).to.equal('d ef', 'test #2');
        });
        it('Should return trimmed text when tabs around text and node and inside text (2)', async () => {
            const nodes = htmlToElements('<p>		<a>		ab		c</a>		<a>		d		ef		</a>		</p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1])).to.equal('ab c', 'test #1');
            expect(removeFormattingSpace(nodes[0].childNodes[3])).to.equal('d ef', 'test #2');
        });
        it('Should return trimmed text when tabs around text and node and inside text (3)', async () => {
            const nodes = htmlToElements('<p>		<a>		ab		c</a><a>		d		ef		</a>		</p>');
            expect(removeFormattingSpace(nodes[0].childNodes[1])).to.equal('ab c', 'test #1');
            expect(removeFormattingSpace(nodes[0].childNodes[2])).to.equal(' d ef', 'test #2');
        });
        it('Should return trimmed text when tabs and line break around text and node and inside text', async () => {
            const nodes = htmlToElements(
                `
<p>
				<a>	ab		c	</a>
				<a>	d		ef	</a>
</p>
`,
            );
            expect(removeFormattingSpace(nodes[1].childNodes[1].firstChild)).to.equal('ab c ');
            expect(removeFormattingSpace(nodes[1].childNodes[3].firstChild)).to.equal('d ef');
            expect(removeFormattingSpace(nodes[0])).to.equal('');
            expect(removeFormattingSpace(nodes[1].firstChild)).to.equal('');
            expect(removeFormattingSpace(nodes[1].childNodes[2])).to.equal('');
            expect(removeFormattingSpace(nodes[1].childNodes[4])).to.equal('');
            expect(removeFormattingSpace(nodes[2])).to.equal('');
        });
    });
    it('Should not return trimmed text when unusal spaces between text and node', async () => {
        const nodes = htmlToElements('<p><a>abc  </a>   <a>  def</a></p>');
        expect(removeFormattingSpace(nodes[0].firstChild.firstChild)).to.equal('abc  ', 'test #1');
        expect(removeFormattingSpace(nodes[0].childNodes[2].firstChild)).to.equal(
            '  def',
            'test #2',
        );
    });
    it('should not format pre', async () => {
        const nodes = htmlToElements('<pre> a </pre>');
        expect(removeFormattingSpace(nodes[0].firstChild)).to.equal(' a ');
    });
    it('should not format textarea', async () => {
        const nodes = htmlToElements('<textarea> a </textarea>');
        expect(removeFormattingSpace(nodes[0].firstChild)).to.equal(' a ');
    });
    describe('nested nodes', () => {
        it('Should return trimmed text when no space around text', async () => {
            const nodes = htmlToElements('<p><span><span><a>abc</a></span></span></p>');
            expect(
                removeFormattingSpace(nodes[0].firstChild.firstChild.firstChild.firstChild),
            ).to.equal('abc');
        });
        it('Should return trimmed text when spaces around text and ancestors node', async () => {
            const nodes = htmlToElements(
                '<p>  <span>  <span>  <a>  abc  </a>  </span>  </span>  </p>',
            );
            expect(
                removeFormattingSpace(
                    nodes[0].childNodes[1].childNodes[1].childNodes[1].firstChild,
                ),
            ).to.equal('abc');
        });
        it('Should return text base on siblings and ancestors', async () => {
            const nodes = htmlToElements(
                '<p>  |  <span>  <span>  <a>  ab  </a>   cd   <a>  ef  </a>  </span>  </span>  |  </p>',
            );
            expect(
                removeFormattingSpace(
                    nodes[0].childNodes[1].childNodes[1].childNodes[1].firstChild,
                ),
            ).to.equal('ab ', 'test #1');
            expect(
                removeFormattingSpace(
                    nodes[0].childNodes[1].childNodes[1].childNodes[3].firstChild,
                ),
            ).to.equal('ef ', 'test #2');
        });
        it('should remove space between a <a> and a <div>', async () => {
            const nodes = htmlToElements('<div><a>abc</a>     <div>def</div></div>');
            expect(removeFormattingSpace(nodes[0].childNodes[1])).to.equal('');
        });
    });
});
