# Things to know with mutations
## innerHTML on an element will trigger remove for each children and add 0 or more elements
Question: does it matter the order in which we add and remove elements from one mutation?
```html
<div><a><span><i>ab</i><b>cd</b>ef</span></a></div>
```
operation: `span.innerHTML = '<s>gh</s><u>ij</u>'`
## mutation record when removing a textNode that is not represented in the document
```html
<div>
  <a></a>
</div>
```
operation: `div.innerHTML = '<b><b><i></i>'`
mutation:
  removedNodes: [textNode "\n  ", `<a>`, textnode "\n"]
  addedNodes: [`<b>`, `<i>`]

## The ancestors and siblings of the nodes might be erroneous
Befause the mutation trigger the callback after one microtask, when cheking the
parent, of a node, it will be equal the parent **after all mutation operation**.

It is not a problem if the sequence order of mutations does not matter but as
shown in the examle above, the sequence order matter.

### Implication
No instruction in the mutation observer can use the
`mutation.target.parentElement` nor `mutation.target.previousSibling`
information as it might not be accurate relative to the sequence order of
mutations.

This happen when: adding/moving an element that is in the tree more than once.

However appending more than once can be avoided in all practical cases but this
will require special attention when developing to not make two nodes being
moved. Throwing a exception could be done.

### Example
Moving a format element to another.

```html
<div><a><b>ab</b></a><c></c><d></d></div>
```
```js
const b = document.querySelector('b');
const c = document.querySelector('c');
const d = document.querySelector('d');
c.append(b);
d.append(b);
```
As observed in https://jsfiddle.net/goaman/xsudg8Lo/26/
There is two mutation being triggered:
- remove `<b>` from `<a>`
  - at that precise time in the observation callback, the ancestors of `<b>` will already
    be [`<d>`, `<div>`]
- add `<b>` into `<c>`
- remove `<b>` from `<c>`
- add `<b>` into `<d>`

# Problems with mutations
## Problem to solve
- need a new cache

### add and remove multiple mutation require new cache
When adding and removing an element in the same stack.

If the content is:
```html
<div><span>ab<b>cd</b>ef</span></div>
```
In the same tick removing the textContent content `cd`, then adding content to
the tag `<b>`, it trigger two mutations in Google Chrome.

Processing one mutation does not refresh the cache of the DomLayout as nothing
will be redrawn. Therefore, we need to create and manage a cache for elements
that are added and remove as we potentially need to retrieve them between two
oreration on the same node.

This management is tricky with Format modifiers.

## Problem linked directly with modifiers
- need two differents logic for node and modifiers
- update all format ancestors in the map when adding/removing inline node inside
- add an inline placeholder when emptying a Format dom node
- wrap textNodes in Container when removing them (in case mutation happen) (might be obselete)
- insert a char at the beginning of inline that has children which is the same
  inline format (no solution yet)
- know wich modifier to keep when placing a node inside a Format that could be
  - as a sibling of a Format
  - as the only child of a Format
- parsing Format node that were already parsed?

### update all format ancestors in the map when adding/removing inline node inside
```html
<div><a><b><c><d>ab</d></c></b></a></div>
```
Operation: prepend `cd` in `<b>`
problem: update ancestors: update `<a>` and `<b>` to point to charnode `c`
problem: mutation ancestors: we do not know what is the pointer to `<a>` as it is the `mutation.target.parent`

similarely:
```html
<div><a><b>ef<c>ab</c>cd</b></a></div>
```
Operation: remove chars `e`
Problem: update ancestors: `<a>` and `<b>` must point now onto the char `f` rather than char `a`
problem: mutation ancestors: we do not know what is the pointer to `<a>` as it is the `mutation.target.parent`

similarely:
```html
<div><a><b>ef<c>ab</c>cd</b></a></div>
```
Operation: remove chars `ef`
Problem: update ancestors: `<a>` and `<b>` must point now onto the char `a` rather than char `ef`
problem: mutation ancestors: we do not know what is the pointer to `<a>` as it is the `mutation.target.parent`

similarely:
```html
<div><a><b><c>ef</c><d>ab</d>cd</b></a></div>
```
Operation: remove `<c>`
Problem: update ancestors: `<a>` and `<b>` must point now onto the char `a` rather than char `ef`
problem: mutation ancestors: we do not know what is the pointer to `<a>` as it is the `mutation.target.parent`

### add an inline placeholder when emptying a Format dom node
```html
<div><a><b><i>ab</i></b></a></div>
```
Operation 1: remove `ab`
Problem: an empty `<i>` must be kept in the abstraction (empty Inline)
Problem: update ancestors
problem: mutation ancestors
or
Operation 1: remove `<i>`
Problem: an empty `<b>` must be kept in the abstraction (empty Inline)
Problem: update ancestors
problem: mutation ancestors

Problem: to know that the Format has no children:
- we can use isSameAs
- we can use the map if it reprensent accurately every Format

### wrap textNodes in Container when removing them (in case mutation happen) (might be obselete)
```html
<div><a>ab</a></div>
```
```js
const div = document.querySelector('div');
const a = document.querySelector('a');
const b = document.createElement('b');
a.remove();
a.append(b);
div.append(a);
```
result:
```html
<div><a>ab<b></b></a></div>
```

problem:
- all the charnode removed should be placed into a dummy container otherwise we
  cannot use after/before/...
  - so all the dummy container should be removed when node are reinserted


### insert a char at the beginning of inline that has children which is the same inline format (no solution yet)
```html
<div><c><c><c>ab</c></c></c></div>
```
operation: append `cd` to first `<c>`
or
operation: append `cd` to second `<c>`
or
operation: append `cd` to third `<c>`
problem:
All the modifiers are contained in `a` and `b` with `[Format, Format, Format]`
differents reference in `a.modifiers` and `b.modifiers`.

How do we have the correspondance from `domNode -> modifiers` or
`modifier -> domNode` ?

### ...
```html
<div><c><c><c>ab</c></c></c><d></d></div>
```
to
```html
<div><c><c>Inline</c></c><d><c>ab</c></d></div>
```
to
```html
<div><c></c><d><c>ab</c><c>Inline</c></d></div>
```
### ...
```html
<div><a><a><b><c></c><i></i><i></i><d></d><i></i><i></i><e></e></b></div>
```
### ...
```html
<div><a></a><b></b><b><c></c><i></i><i></i><d></d><i></i><i></i><e></e></b></div>
```

## Problem with the mutation handled at the end
### each node that has been removed has potentially be added in the parsing
```html
<div><a>ab</a></div>
```
```js
const div = document.querySelector('div');
const a = document.querySelector('a');
const b = document.createElement('b');
b.append(a);
div.append(b);
```
problem: there is no mutation for the added `<a>`
solution:
- at the remove stage: check if the dom node is still present in the dom before
  removing from the abstraction

### modifier problem: getNodes on a Format after append/remove
```html
<div><a><b><c>ab<c></b></a><d></d></div>
```
```js
const div = document.querySelector('div');
const b = document.querySelector('b');
const c = document.querySelector('c');
const d = document.querySelector('d');
d.append(c);
b.remove(c);
```
problem: when adding `<c>` in `<d>`, we need to remove from the map the chars `ab`

## ...
```html
<div><a><b><c>ab</c></b></a><d></d><e></e></div>
```
operation: move `<b>` in `<d>`
operation: add `<a>` in `<c>`
operation: move `<c>` in `<d>`
or
operation: move `<c>` in `<d>`
operation: add `<a>` in `<c>`
operation: move `<b>` in `<d>`
## complex interaction
```html
<div><a><b>ab<c>cd</c></b><d>ef</d></a></div>
```
```js
const div = document.querySelector('div');
const b = document.querySelector('b');
const e = document.createElement('e');
const f = document.createElement('f');
const g = document.createElement('g');
e.append(f);
f.append(b);
f.append(g);
div.append(e);
```
resulting in
```html
<div><a><d>ef</d></a><e><f><b>ab<c>cd</c></b><g></g></f></e></div>
```
Two mutations will occurs:
- one for removing `<b>` from `<a>` (`f.append(b)` generate remove)
- no mutation will append directly to the `<f>` as it's not in the dom
- one for adding `<e>` to `<div>`

jsfiddle: https://jsfiddle.net/goaman/xsudg8Lo/34/

Problem:
1) remove `<a>`:
1.1) add placeholder into `<q>`
1.2) remove Format `<q>` from chars `abcd`
1.3) update in custom map the tag `<q>` to target chars `ef` (all remaining
     inlinenode inside it's container)
2) add mutation:
2.1) need to parse `<b>` and `<i>` and `<u>` but not `<a>` and their children.
     (in other circumstance)
2.1) the charnode `abcd` should have the Format `i` and `b` prepended

The problem occurs for the map for the ancestors and potentially the VDOM map.
Maybe it does not create problem in the VDOM map they are added when parsed.

If in the mean time, before the instruction `div.append(b)`, a text node is
appended to `<a>`, copying the modifiers when appending will be wrong as the
editor has not parsed `nor <b> nor <i>`. This problem arise with or without
modifiers being node or within an array (i.e. old paradigm vs new paradigm).

# Brainstorm

## When removing node
```html
<div><a>ab<e><b>bc<c>de</c></b></e><d>fg</d></a></div>
```
## 2 problems
```html
<div><a>ab<b>bc<c>de</c></b><d>fg</d></a></div>
```

## record each added/removed node and add them after
```html
<div><a><b><c>ab</c></b></a></div>
```

record all remove
record all add

for each remove:
  - remove them from the vdoc only if not present in the dom
for all add:
  for each add target:
    - sort them by their position in the current dom?
    - parsing: parse node that are new
      - if node are in the map and not in the vdom, insert them back as they
        were removed with "remove" loop
    - remove them from their current container
    - put a placeholder if necessary
    - add them in the vdoc

## override the function of each node append/prepend/...
The problem where it is hard to know which parent/sibling can be mitigated by
creating a custom mutation observer that override all the methods of the node
temporarily and hook them.
## modifiers -> nodes -> modifiers
```html
<div><a><c><c>ab</c></c></a></div>
```
is

div
  [[[abc]]]

modifiers -> nodes
div
  a
    c
      c
        ab

nodes -> modifiers
div
  [[[abc]]]

problem: it is peformance intensive as it will need to go through the whole sub
tree two times. One for "modifiers -> nodes", one for "nodes -> modifiers".
The complexity is O(n) where n is the number of nodes and modifiers.

## change attribute of a format
