# Cases and implementation
## Ctrl B
- event "ctrl+b"
- dispatcher
  - for each plugin react to "ctrl+b"
    - batch = plugin.event("ctrl+b", arch)
    - // analyse the batch wich previous changes
    - 


newArch = with_arch(arch) do
  node = arch.find(x)
  [newArch], b(node)
  return newArch

b:: a => [a, a]
b = (node) =>
  n2 = node.find(y)
  nodeA = n2.parent.parent.firstChild('a')
  newArch = wich_arch_write() do
    nodeAbis = nodeA.append('foo')
    y()

  [newArch, n3] = n2.setTitle("foo")
  return with_arch(newArch) do
    c(n3)

c = (node) =>
  node...

stack = []
witch_arch = (arch, callback) =>
  stack.push(arch)
  callback().then(() =>{
    stack.pop()
  }


find(selector) = ()=>
  arch = stack[-1]
  arch.find(selector)

append(node, text) = ()=>
  arch = stack[-1]
  nodeInArch = arch.findId(node.id)
  [newArch, newNode] = nodeInArch.anyMutation() #...
  return [newArch, newNode]


