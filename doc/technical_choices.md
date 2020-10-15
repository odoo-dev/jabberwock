
# The diff strategy

## The simple strategy vs diff strategy
It would be simple to make the change in our API, then change the related nodes
in the DOM. But there is some problems that we need to address.

So rather than 2 steps (direct strategy):
1) apply in VDOC
2) apply in DOM

We do 4 steps (diff strategy):
1) apply in DOM
2) apply in VDOC
3) diff DOM-VDOC
4) apply in DOM

### Problem 1: Dictionnary and spell checkers
When preventing an event, if the dictionnary was saving data, it does not clear
it's internal memory. So when another event happen, the dictionnary has wrong
data and might create strange correction.

[provide examples]

### Problem 2: Mouvement between words
When you have a word and you hit `ctrl + arrow`, you want to move from one word
to the other. In some language like Lao, the words might not be separated by
spaces. In order to know where is the delimitation of the word, we allow the
browser to move the cursor and we reflect that navigation change in our VDOC.

### Problem of the diff strategy
Because we need the event to happen in the DOM it is possible that our VDOC will
have a different rendering then what the browser registred. In such case, glitch
can occurs.

[Provide gif images to show a glitch]

### Exceptions
It is possible in some case to be sure that there is no dictionnary/spell cheker
running or that we can predict the movement of the words. In such case, we
can use the browser `event.preventDefault()` and therfore avoid any possible
glitch.

### Alternatives
Ckeditor: deactivate the spellcheck alltogether and use third party plugins.

Quilljs: ?

# One char per char
## Benefits
1) When doing enter, backspace, [list more case], it is easier to create an
algorithm that does not need to look at all the modifier.
2) It is easier to handle the range. When we move characters, we do not need
to calculate the range.

