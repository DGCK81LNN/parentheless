export class Operator {
  constructor(name, priority) {
    this.name = name
    this.priority = priority
  }
  get type() {
    return "unknown"
  }
  toString() {
    return String(this.name)
  }
  format(childNodes) {
    return `(${this} ${childNodes.join(" ")})`
  }
}
export class BinaryOperator extends Operator {
  get type() {
    return "binary"
  }
  format([lhs, rhs]) {
    return `(${lhs} ${this} ${rhs})`
  }
}
export class UnaryPrefixOperator extends Operator {
  get type() {
    return "unary prefix"
  }
  format([exp]) {
    return `(${this} ${exp})`
  }
}
export class UnaryPostfixOperator extends Operator {
  get type() {
    return "unary postfix"
  }
  format([exp]) {
    return `(${exp} ${this})`
  }
}

export class Node {
  constructor(value) {
    this.value = value
  }
  get type() {
    return "unknown"
  }
}
export class OperatorNode extends Node {
  constructor(value) {
    super(value)
    this.childNodes = []
  }
  appendChild(node) {
    this.childNodes.push(node)
    return node
  }
  get type() {
    return "opr"
  }
  get lastChild() {
    return this.childNodes.at(-1)
  }
  set lastChild(node) {
    this.childNodes.pop()
    this.childNodes.push(node)
  }
  toString() {
    return this.value.format(this.childNodes)
  }
}
export class ValueNode extends Node {
  constructor(value = null) {
    super(value)
  }
  get type() {
    return "val"
  }
  toString() {
    return String(this.value)
  }
}

export class Scope {
  constructor(node, looseness = 0) {
    this.node = node
    this.looseness = looseness
  }
}

export class Parser {
  constructor(defOp) {
    this.defOp = defOp
  }

  parse(tokens) {
    const that = this
    let curr = null
    const stack = []
    let looseness = Infinity
    let awaitingVal = true

    for (let token of tokens) {
      if (token === null) looseness++
      else if (token instanceof Operator) addOpr(token)
      else addVal(token)
    }
    
    if (awaitingVal) throw new Error(` Unexpected EOF, extected value`)
    return stack[0].node

    function addOmittedOprIfNeeded() {
      if (awaitingVal) return
      let looseness_ = looseness
      addOpr(that.defOp)
      looseness = looseness_
    }

    function addVal(val) {
      addOmittedOprIfNeeded()
      let valNode = new ValueNode(val)
      if (curr) curr.node.appendChild(valNode)
      curr = new Scope(valNode, looseness)
      stack.push(curr)
      looseness = 0
      awaitingVal = false
    }
  
    function addOpr(opr) {
      let oprNode = new OperatorNode(opr)
      let oprScope = new Scope(oprNode)
      
      if (opr.type === "unary prefix") {
        addOmittedOprIfNeeded()
        oprScope.looseness = looseness
        if (curr) curr.node.appendChild(oprNode)
      } else {
        if (awaitingVal)
          throw new Error(`Unexpected ${opr.type} operator ${opr.name}, expected value`)
  
        let leftScope
        do {
          leftScope = stack.pop()
        } while (
          leftScope.looseness < looseness ||
          leftScope.looseness === looseness &&
          stack.at(-1).node.value.priority >= opr.priority
        )

        if (stack.length) stack.at(-1).node.lastChild = oprNode
        oprScope.looseness = leftScope.looseness
        oprNode.appendChild(leftScope.node)
        leftScope.looseness = looseness
      }

      looseness = 0
      curr = oprScope
      stack.push(oprScope)
      awaitingVal = opr.type !== "unary postfix"
    }
  }
}