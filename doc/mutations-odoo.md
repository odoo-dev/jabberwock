check _refreshPublicWidgets


await this.wysiwyg.withDomMutation(this.$target, () => {
});

## problems with mutations
### preview mode
each "event preview", there is a new execCommand.

```
event preview: true
event preview: 'reset'
event preview: true
event preview: 'reset'
event preview: true
event preview: 'reset'
event preview: false
```

We should be able to revert thoses changes.

#### solution
skip/merge slice where nothing changed in the memory

### withDomMutation nested
Is there a problem with nested mutations?
```js
function a (context) {
  context.withDomMutation(el, ()=>{
    b();
  })
}
function b (context) {
  context.withDomMutation(el, ()=>{
    this.$target.find('span').remove();
  })
}
```
### multiple roots
```js
function a (context) {
  context.withDomMutation([el1, el2], ()=>{
    this.$target.find('span').remove();
  })
}
```
