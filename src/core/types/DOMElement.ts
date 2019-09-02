// The api of the native HTMLElement class is incredibly cumbersome to use. It
// might be expected than the child of an HTMLElement would be an HTMLElement,
// but it is not how the api is implemented. Childrens are instances of the
// ChildNode interface and parents of the ParentNode one. This implies that
// every time a child or parent is assigned to a variable of type HTMLElement,
// it must be cast into this type first, even though this should be obvious.

// This file exports a DOMElement class which fixes this issue by working
// exactly as the HTMLElement class would be expected to. This is achieved by
// first creating an interface extending HTMLElement but exluding the wrongly
// typed properties, then redefining these properties using the brand new type.

// Unfortunately, TypeScript does not provide a syntax for excluding multiple
// properties from a single type, so multiple Omit had to be used. They were
// kept separate rather than chained in a single definition for readability.
type HTMLElementOmit1 = Omit<HTMLElement, 'parentNode'>;
type HTMLElementOmit2 = Omit<HTMLElementOmit1, 'firstChild'>;
type HTMLElementOmit3 = Omit<HTMLElementOmit2, 'lastChild'>;
type HTMLElementOmit4 = Omit<HTMLElementOmit3, 'nextSibling'>;
type HTMLElementOmit5 = Omit<HTMLElementOmit4, 'previousSibling'>;

export interface DOMElement extends HTMLElementOmit5 {
    parentNode: DOMElement;
    firstChild: DOMElement;
    lastChild: DOMElement;
    nextSibling: DOMElement;
    previousSibling: DOMElement;
}
