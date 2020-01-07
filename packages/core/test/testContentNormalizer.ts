/**
 * This mapping exist to ease the tests of the normalizer.
 * We use this dictionnary to:
 * - autofill editable in the normalizer tool
 * - set the content in the tests
 */
export const testContentNormalizer = {
    hell: `<p id='a'>hell</p>`,
    hello: `<p id='a'>hello</p>`,
    ahello: `<p id='a'>a hello</p>`,
    ahillo: `<p id='a'>a hillo</p>`,
    hellototo: `<p id='a'>hello toto</p>`,
    atestb: `<p id='a'>a test b</p>`,
    atestbBold: `<p id='a'>a <b id='b'>test</b>, b</p>`,
    atestbcBold: `<p id='a'>a <b>test</b> b, c</p>`,
    multiStyled: `<p id='a'>a <b>t<u>e</u>s</b>t b</p>`,
    abcg: `<p id='a'>a <b>test</b> b, c<i>test</i> g</p>`,
    multiline: `<p id='a'>abc<br/>def</p>`,
    hellworld: `<p id='a'>hell<br/>world</p>`,
};
