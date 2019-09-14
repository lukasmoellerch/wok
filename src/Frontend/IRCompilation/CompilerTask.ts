import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { IType } from "../Type/Type";
export class CompilerTask {
  public toString(): string {
    throw new Error();
  }
}
export class CompileUnboundFunctionTask extends CompilerTask {
  constructor(public declaration: UnboundFunctionDeclaration) {
    super();
  }
  public toString(): string {
    return `Compile unbound function ${this.declaration.name.content}`;
  }
}
export class CompileConstructor extends CompilerTask {
  constructor(public type: IType) {
    super();
  }
  public toString(): string {
    return `Compile constructor of ${this.type.toString()}`;
  }
}
export class CompileOperator extends CompilerTask {
  constructor(public type: IType, public str: string, public arity: string) {
    super();
  }
  public toString(): string {
    return `Compile operator ${this.str} of ${this.type.toString()}`;
  }
}
export class CompileMethod extends CompilerTask {
  constructor(public type: IType, public str: string, public arity: string) {
    super();
  }
  public toString(): string {
    return `Compile method ${this.str} of ${this.type.toString()}`;
  }
}
