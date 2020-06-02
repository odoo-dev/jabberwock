# Modifiers
A modifier is: ...

The main modifiers are `Attribute` and `Format`.

## Attributes
When parsing and rendering a document, we need to save the attributes that a
DOM node has and save it in our VNode.

Attributes exists to:
- retrieve HTML attributes that a DOM node has originally
- render the HTML attributes that a VNode has

## Format
The DOM inline nodes (e.g. span, strong, em, b, a, ...) in HTML are difficult to
manipulate. We therefore we transform them into a Format modifiers that we
attach to a VNode through the "modifiers" properties.

Format themselve have modifiers. For instance, a HTML strong tag migh have
attributes (styles, classes, ...).
