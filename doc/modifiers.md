# Modifiers
## Limitations

### space and time complexity
The modifiers need to be copied for each of the characters, which adds quite
some data for each chars which will require quite some processing when
combining them.

### equality and inequality of formats
When there is a list of format on two charNode
`charNodeA.modifiers === [SpanFormat, LinkFormat, SpanFormat]`
`charNodeB.modifiers === [SpanFormat, LinkFormat, SpanFormat]`
and we want to check if `charNodeA.modifiers[0] === charNodeB.modifiers[0]`,
tt will be false as it is not the same object.

Also `charNodeA.modifiers[0].isSameAs(charNodeB.modifiers[2])` would be true
but would not be the same rendered modifier.

### other

`<div><i>ab</b>cd</b>ef</i></div>`

`<div><i>[ab]</b>cd</b>ef</i></div>`


If I want add a char in textnode at position represented by `|`:

`<div><a><i><b>|x|1|</b>|a|b|<b>|c|d|</b>|e|f|<b>|x|2|</b></i></a></div>`

`<div><a><i>ab<b>cd</b>ef</i></a></div>`
What is the parent VNode of the textNode `ab` ?
If I do domLayout.getNode(textNode.parent), I receive [abcdef] with differents
modfiers.
- I want to insert/remove next to `<div>`
- I want to insert/remove next to `<a>`
- I want to insert/remove next to `<i>`
- I want to insert/remove next to `ab`
- I want to insert/remove next to `<b>`
- I want to insert/remove next to `bc`
- I want to insert/remove next to `</b>`
- I want to insert/remove next to `ef`
- I want to insert/remove next to `</i>`
- I want to insert/remove next to `</a>`
- I want to insert/remove next to `</div>`

- I want to characterData to `ab`
- I want to characterData to `cd`
- I want to characterData to `ef`


## Alternative to Format modifiers
- Each format would be a node in the tree
- We can have a tree walker that accept options (to ignore some nodes on
  nextSibling/previousSibling/...)
- When needing to operate on the nodes without caring about the formats, we use
  a treewalker that filter the formatNodes
- when we detach a group of TextNode, we attach to all textNodes a reference to
  their corresponding inline ancestors up to a container ancestor.
- when we reattach the textnode, we join (append/prepend/...) the inlineNodes
  together.

- With that strategy, it would be easier to create a cache for textNode as being
  a parent of the rendered textNodes which could accellerate the



Benefits:
- No need to create FormatRenderers
  - Reduce codebase for dealing with FormatRenderer and theirs caches
  - Less concept to know
- Remove isSameAs
- No need to understand the logic of Format which can be challenging to grasp
  when thinking about their representation in the tree and related to their
  modifiers.
- Take less space (no more modifiers on InlineNode)
- The rendered Format just return a node rather than a Modifier that is
  difficult to equate

