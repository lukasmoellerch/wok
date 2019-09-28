import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { IType } from "../Type/Type";
export class CompilerTask {
  public indirectlyReferenced: boolean = false;
  public toString(): string {
    throw new Error();
  }
  public irName(): string {
    throw new Error();
  }
  public indirectString(): string {
    return this.indirectlyReferenced ? "[indirect]" : "[]";
  }
}
export class CompileUnboundFunctionTask extends CompilerTask {
  constructor(public declaration: UnboundFunctionDeclaration) {
    super();
  }
  public toString(): string {
    return `Compile unbound function ${this.indirectString()} ${this.declaration.name.content}`;
  }
  public irName(): string {
    if (this.declaration.decoratorMap.has("export")) {
      return this.declaration.name.content;
    } else {
      return `function#${this.declaration.name.content}`;
    }
  }
}
export class CompileConstructor extends CompilerTask {
  constructor(public type: IType) {
    super();
  }
  public toString(): string {
    return `Compile constructor of ${this.indirectString()} ${this.type.toString()}`;
  }
  public irName(): string {
    return `constructor#${this.type.toString()}`;
  }
}
export class CompileOperator extends CompilerTask {
  constructor(public type: IType, public str: string, public arity: number) {
    super();
  }
  public toString(): string {
    return `Compile operator ${this.indirectString()} ${this.str} of ${this.type.toString()}`;
  }
  public irName(): string {
    return `operator#${this.type.toString()}#${this.str}#${this.arity}`;
  }
}
export class CompileMethod extends CompilerTask {
  constructor(public type: IType, public str: string, public arity: number) {
    super();
  }
  public toString(): string {
    return `Compile method ${this.indirectString()} ${this.str} of ${this.type.toString()}`;
  }
  public irName(): string {
    return `method#${this.type.toString()}#${this.str}#${this.arity}`;
  }
}
