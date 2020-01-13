/**
 * This mapping exist to ease the tests of the normalizer.
 * We use this dictionnary to:
 * - autofill editable in the normalizer tool
 * - set the content in the tests
 */
export const testContentNormalizer = {
    hell: `<p>hell</p>`,
    hello: `<p>hello</p>`,
    ahello: `<p>a hello</p>`,
    ahillo: `<p>a hillo</p>`,
    hellototo: `<p>hello toto</p>`,
    atestb: `<p>a test b</p>`,
    atestbBold: `<p>a <b>test</b>, b</p>`,
    atestbcBold: `<p>a <b>test</b> b, c</p>`,
    multiStyled: `<p>a <b>t<u>e</u>s</b>t b</p>`,
    abcg: `<p>a <b>test</b> b, c<i>test</i> g</p>`,
    multiline: `<p>abc<br/>def</p>`,
    hellworld: `<p>hell<br/>world</p>`,
};
