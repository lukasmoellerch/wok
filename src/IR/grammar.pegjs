{
  function extractList(list, index) {
    return list.map(function(element) { return element[index]; });
  }

  function buildList(head, tail, index) {
    return [head].concat(extractList(tail, index));
  }
  const ui32 = 0;
  const si32 = 1;
  const ui64 = 2;
  const si64 = 3;
  const f32 = 4;
  const f64 = 5;
  const ptr = 6;
  const funcptr = 7;
}
Root
  = externalFunctionDeclarations:ExternalFunctionDeclarations? internalFunctionDeclarations:InternalFunctionDeclarations? functionCode:FunctionCode?{
    return {
      externalFunctionDeclarations: externalFunctionDeclarations || [],
      internalFunctionDeclarations: internalFunctionDeclarations || [],
      functionCode: functionCode || []
    }
  }
FunctionCode
  = _ head:FunctionDefinition tail:(_ FunctionDefinition _)* {
    return buildList(head, tail, 1)
  }
FunctionDefinition
  = "function" _ identifier:Identifier _ "[" _ variableTypes:TypeList _ "]" _ "{" _ code:BlockArray _ "}" {
    return {
     identifier,
     variableTypes,
     code
    }
  }
BlockArray
  = _ head:Block tail:(_ Block _)* {
    return buildList(head, tail, 1)  
  }
Block
  = BasicBlock / BreakableBlock / LoopBlock / IfBlock / IfElseBlock
BasicBlock
  = _ head:Statement tail:(_ Statement)* {
    return {
      type: 0,
      statements: buildList(head, tail, 1),
    }
  }
LoopBlock
  = _ "loop" _ "{" _ blocks:BlockArray _ "}" _ {
    return {
      type: 1,
      blocks,
    }
  }
BreakableBlock
  = _ "block" _ "{" _ blocks:BlockArray _ "}" _ {
    return {
      type: 2,
      blocks,
    }
  }
IfBlock
  = _ "if" _ condition:Variable _ "{" _ a:BlockArray _ "}" _ {
    return {
      type: 3,
      condition,
      blocks: a,
    }
  }
IfElseBlock
  = _ "ifelse" _ condition:Variable _ "{" _ a:BlockArray _ "}" _ "else" _ "{" _ b:BlockArray _ "}" {
    return {
      type: 4,
      condition,
      true: a,
      false: b
    }
  }
Statement
  = a:Variable _ "=" _ "phi" _ "(" _ b:VariableList _ ")" NL  {return [0,a,b]}
  / "break" NL  {return [1]}
  / "breakIfFalse" _ v:Variable NL  {return [3, v]}
  / "breakIfTrue" _ v:Variable NL  {return [2, v]}
  / "(" _ targets:VariableList _ ")" _ "=" _ identifier:Identifier _ "(" _ args:VariableList _ ")" NL  {return [4, identifier, targets, args]}
  / "(" _ targets:VariableList _ ")" _ "=" _ v:Variable _ "(" _ argTypes:TypeList _ ")" _ "->" _ "(" _ resultTypes:TypeList _ ")"  _ "(" _ args:Variable _ ")" NL  {return [5, v, [argType, resultTypes], targets, args]}
  / a:Variable _ "=" _ "const" _ num:Integer NL  {return [6,a,num]}
  / a:Variable _ "=" _ "&" identifier:Integer NL  {return [7,a,identifier]}
  / a:Variable _ "=" _ "$" num:Integer _ NL  {return [8,num]}
  / a:Variable _ "=" _ "copy" _ id:Identifier _ NL  {return [9,a,b]}
  / a:Variable _ "=" _ "load" "(" _ b:Variable _ ")" _ "as" _ type:Type _ NL  {return [10,a,b,type]}
  / "store" "(" _ position:Variable _ "," _ val:Variable _ ")" _ "as" _ type:Type _ NL  {return [11,position,val,type]}
  / a:Variable _ "=" _ "convert" _ b:Variable _ "to" _ type:Type NL  {return [12,a,b,type]}
  / a:Variable _ "=" _ "eqz" _ b:Variable NL  {return [13,a,b]}
  / a:Variable _ "=" _ "eq" _ b:Variable _ c:Variable NL  {return [14,a,b,c]}
  / a:Variable _ "=" _ "neq" _ b:Variable _ c:Variable NL  {return [15,a,b,c]}
  / a:Variable _ "=" _ "less" _ b:Variable _ c:Variable NL  {return [16,a,b,c]}
  / a:Variable _ "=" _ "greater" _ b:Variable _ c:Variable NL  {return [17,a,b,c]}
  / a:Variable _ "=" _ "lessEqal" _ b:Variable _ c:Variable NL  {return [18,a,b,c]}
  / a:Variable _ "=" _ "greaterEq" _ b:Variable _ c:Variable NL  {return [19,a,b,c]}
  / a:Variable _ "=" _ "clz" _ c:Variable NL  {return [20,a,b]}
  / a:Variable _ "=" _ "ctz" _ c:Variable NL  {return [21,a,b]}
  / a:Variable _ "=" _ "add" _ b:Variable _ c:Variable NL  {return [22,a,b,c]}
  / a:Variable _ "=" _ "sub" _ b:Variable _ c:Variable NL  {return [23,a,b,c]}
  / a:Variable _ "=" _ "mul" _ b:Variable _ c:Variable NL  {return [24,a,b,c]}
  / a:Variable _ "=" _ "div" _ b:Variable _ c:Variable NL  {return [25,a,b,c]}
  / a:Variable _ "=" _ "rem" _ b:Variable _ c:Variable NL  {return [26,a,b,c]}
  / a:Variable _ "=" _ "and" _ b:Variable _ c:Variable NL  {return [27,a,b,c]}
  / a:Variable _ "=" _ "or" _ b:Variable _ c:Variable NL  {return [28,a,b,c]}
  / a:Variable _ "=" _ "xor" _ b:Variable _ c:Variable NL  {return [29,a,b,c]}
  / a:Variable _ "=" _ "shl" _ b:Variable _ NL  {return [30,a,b]}
  / a:Variable _ "=" _ "shr" _ b:Variable _ NL  {return [31,a,b]}
  / a:Variable _ "=" _ "rotl" _ b:Variable _ NL  {return [32,a,b]}
  / a:Variable _ "=" _ "rotr" _ b:Variable _ NL  {return [33,a,b]}
  / a:Variable _ "=" _ "abs" _ b:Variable _ NL  {return [34,a,b]}
  / a:Variable _ "=" _ "neg" _ b:Variable _ NL  {return [35,a,b]}
  / a:Variable _ "=" _ "floor" _ b:Variable _ NL  {return [36,a,b]}
  / a:Variable _ "=" _ "trunc" _ b:Variable _ NL  {return [37,a,b]}
  / a:Variable _ "=" _ "nearest" _ b:Variable _ NL  {return [38,a,b]}
  / a:Variable _ "=" _ "sqrt" _ b:Variable _ NL  {return [39,a,b]}
  / a:Variable _ "=" _ "min" "(" _ b:Variable _ "," _ c:Variable _ ")" _ NL  {return [40,a,b,c]}
  / a:Variable _ "=" _ "min" "(" _ b:Variable _ "," _ c:Variable _ ")" _ NL  {return [41,a,b,c]}
Variable
  = "%" n:Integer {
    return n
  }
InternalFunctionDeclarations
  = _ decl:( InternalFunctionDeclaration _)* {
    return decl.map(a=>a[0])
  }
InternalFunctionDeclaration
  = "function" _ "[" _ attributes:Attributes _ "]" _ identifier:Identifier _ "(" _ args:TypeList _ ")" _ "->" _ "(" _ results:TypeList _ ")" NL {
    return {
      identifier,
      type: [args, results],
      inlinable: attributes.indexOf("inlinable")!==-1,
      globalStateMutating: attributes.indexOf("globalStateMutating")!==-1,
      tableElement: attributes.indexOf("tableElement")!==-1,
    }
  }
Attributes
  = _ head:Identifier tail:(_ "," _ Identifier _ )* {
    return buildList(head, tail, 3);
  }
ExternalFunctionDeclarations
  = _ decl:(ExternalFunctionDeclaration _)* {
	return decl.map(a=>a[0])
  }
ExternalFunctionDeclaration
  = "import" _ externalName:Identifier _ "(" _ args:TypeList _ ")" _ "->" _ "(" _ results:TypeList _ ")" _ "as" _ identifier:Identifier NL {
  	return {
      identifier,
      type: [args, results],
      externalName,
    }
  }
TypeList
  = head:Type tail:(_ "," _ Type _)* {
	return buildList(head, tail, 3)
  }
  / _ {
  	return []
  }
VariableList
  = head:Variable tail:(_ "," _ Variable _)* {
	return buildList(head, tail, 3)
  }
  / _ {
  	return []
  }
Type
  = "ui32" { return ui32 }
  / "si32" { return si32 }
  / "ui64" { return ui64 }
  / "si64" { return si64 }
  / "f32" { return f32 }
  / "f64" { return f64 }
  / "funcptr" { return funcptr }
  / "ptr" { return ptr }
   
Integer "integer"
  = _ [0-9]+ { return parseInt(text(), 10); }
Identifier "identifier"
  = _ [a-zA-Z0-9]+ { return text() }

_ "whitespace"
  = [ \t\n\r]*
NL "newline"
  = [\n\r]+

              