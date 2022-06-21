import {
  Operator,
  BinaryOperator,
  UnaryPrefixOperator,
  UnaryPostfixOperator,
  Parser,
  OperatorNode,
  ValueNode,
} from "./parser.mjs"

const keywords = {
  _: null,
  plus: new BinaryOperator("plus", 1),
  minus: new BinaryOperator("minus", 1),
  times: new BinaryOperator("times", 2),
  div: new BinaryOperator("div", 2),
  into: new BinaryOperator("into", 2),
  mod: new BinaryOperator("mod", 2),
  pow: new BinaryOperator("pow", 3),
  neg: new UnaryPrefixOperator("neg", 4),
  sqrt: new UnaryPrefixOperator("sqrt", 4),
  squared: new UnaryPostfixOperator("squared", 6),
}
const defOp = new BinaryOperator("times", 5)
const parser = new Parser(defOp)
const displayNames = {
  plus: "加",
  minus: "减",
  times: "乘",
  div: "除以",
  into: "分之",
  mod: "模",
  pow: "乘方",
  squared: "平方",
  neg: "负",
  sqrt: "根号",
}

const $$$ = document.getElementById.bind(document)
const $input = $$$("input")
const $tokens = $$$("tokens")
const $tree = $$$("tree")

const $C = document.createElement.bind(document)

$input.addEventListener("input", () => {
  update(false)
})
$input.addEventListener("change", () => {
  update()
})

update()

function update(showError = true) {
  let words = $input.value.trim().split(/\s+/)
  let tokens = words.map(word => {
    if (keywords.hasOwnProperty(word)) return keywords[word]
    return word
  })
  
  $tokens.textContent = ""
  tokens.forEach(token => {
    let $el = $C("div")
    $tokens.append($el)
    if (token === null) {
      $el.className = "el el-nul"
      $el.textContent = "-"
    } else if (token instanceof Operator) {
      $el.className = "el el-opr"
      $el.textContent = displayNames[token.name]
    } else {
      $el.className = "el el-val"
      $el.textContent = String(token)
    }
  })
  
  try {
    const tree = parser.parse(tokens)
    $tree.textContent = ""
    $tree.append(renderTree(tree))
  } catch (err) {
    if (showError) {
      console.log(err)
      $tree.innerText = err
    }
  }
}

function renderTree(node) {
  let $el = $tokens.appendChild($C("div"))
  $el.className = `el el-${node.type}`

  if (node.type === "val") {
    $el.textContent = String(node.value)
  } else if (node.type === "opr") {
    let name = node.value.name
    let $name = $C("div")
    $name.textContent = displayNames.hasOwnProperty(name) ? displayNames[name] : name
    $name.className = "opr-name"
    $el.append($name)

    if (node.value.type === "binary") {
      $el.prepend(renderTree(node.childNodes[0]))
      $el.append(renderTree(node.childNodes[1]))
    } else if (node.value.type === "unary postfix") {
      $el.prepend(renderTree(node.childNodes[0]))
    } else {
      node.childNodes.forEach(child => {
        $el.append(renderTree(child))
      })
    }
  }
  return $el
}
