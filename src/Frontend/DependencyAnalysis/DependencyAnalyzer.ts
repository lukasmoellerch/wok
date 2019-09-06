import { ASTWalker } from "../AST/ASTWalker";
import { BinaryOperatorExpression } from "../AST/Nodes/BinaryOperatorExpression";
import { IdentifierCallExpression } from "../AST/Nodes/IdentifierCallExpression";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { IType } from "../Type/Type";
import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
import { VariableScopeEntry, VariableScopeEntryType } from "../VariableScope/VariableScope";
enum AnalyzerTaskType {
  globalUnboundFunction,
  type,
  method,
  constructor,
  operator,
  property,
}
class AnalyzerTaskBase {
  public equals(_other: Task): boolean {
    throw new Error();
  }
  public toString(): string {
    return "[BASE]";
  }
}
class AnalyzeGlobalUnboundFunction extends AnalyzerTaskBase {
  public taskType = AnalyzerTaskType.globalUnboundFunction;
  public entry: VariableScopeEntry;
  constructor(entry: VariableScopeEntry) {
    super();
    this.entry = entry;
  }
  public equals(other: Task): boolean {
    if (!(other instanceof AnalyzeGlobalUnboundFunction)) {
      return false;
    }
    if (other.entry !== this.entry) {
      return false;
    }
    return true;
  }
  public toString(): string {
    return `[FUNCTION] ${this.entry.str}`;
  }
}
class AnalyzeType extends AnalyzerTaskBase {
  public taskType = AnalyzerTaskType.type;
  public type: IType;
  constructor(type: IType) {
    super();
    this.type = type;
  }
  public equals(other: Task): boolean {
    if (!(other instanceof AnalyzeType)) {
      return false;
    }
    if (!this.type.equals(other.type)) {
      return false;
    }
    return true;
  }
  public toString(): string {
    return `[TYPE] ${this.type.toString()}`;
  }
}
class AnalyzeMethod extends AnalyzerTaskBase {
  public taskType = AnalyzerTaskType.method;
  public type: IType;
  public method: string;
  public arity: number;
  constructor(type: IType, method: string, arity: number) {
    super();
    this.type = type;
    this.method = method;
    this.arity = arity;
  }
  public equals(other: Task): boolean {
    if (!(other instanceof AnalyzeMethod)) {
      return false;
    }
    if (!this.type.equals(other.type)) {
      return false;
    }
    if (this.method !== other.method) {
      return false;
    }
    if (this.arity !== other.arity) {
      return false;
    }
    return true;
  }
  public toString(): string {
    return `[METHOD] ${this.type.toString()} ${this.method} ${this.arity}`;
  }
}
class AnalyzeConstructor extends AnalyzerTaskBase {
  public taskType = AnalyzerTaskType.constructor;
  public type: IType;
  public arity: number;
  constructor(type: IType, arity: number) {
    super();
    this.type = type;
    this.arity = arity;
  }
  public equals(other: Task): boolean {
    if (!(other instanceof AnalyzeConstructor)) {
      return false;
    }
    if (!this.type.equals(other.type)) {
      return false;
    }
    if (this.arity !== other.arity) {
      return false;
    }
    return true;
  }
  public toString(): string {
    return `[CONSTRUCT] ${this.type.toString()} $constructor ${this.arity}`;
  }
}
class AnalyzeOperator extends AnalyzerTaskBase {
  public taskType = AnalyzerTaskType.operator;
  public type: IType;
  public operator: string;
  public arity: number;
  constructor(type: IType, operator: string, arity: number) {
    super();
    this.type = type;
    this.operator = operator;
    this.arity = arity;
  }
  public equals(other: Task): boolean {
    if (!(other instanceof AnalyzeOperator)) {
      return false;
    }
    if (!this.type.equals(other.type)) {
      return false;
    }
    if (this.arity !== other.arity) {
      return false;
    }
    return true;
  }
  public toString(): string {
    return `[OPERATOR] ${this.type.toString()} ${this.operator} ${this.arity}`;
  }
}
class AnalyzeProperty extends AnalyzerTaskBase {
  public taskType = AnalyzerTaskType.property;
  public type: IType;
  public propertyName: string;
  constructor(type: IType, propertyName: string) {
    super();
    this.type = type;
    this.propertyName = propertyName;
  }
  public equals(other: Task): boolean {
    if (!(other instanceof AnalyzeProperty)) {
      return false;
    }
    if (!this.type.equals(other.type)) {
      return false;
    }
    if (this.propertyName !== other.propertyName) {
      return false;
    }
    return true;
  }
  public toString(): string {
    return `[PROPERTY] ${this.type.toString()} ${this.propertyName}`;
  }
}
type Task = AnalyzerTaskBase;

export class DependencyAnalyzer extends ASTWalker {
  private typeIndex: number = 0;
  private typeArray: IType[] = [];

  private finishedTasks: Task[] = [];
  private tasks: Task[] = [];
  private currentTask: Task | undefined;
  public walkSourceFile(sourceFile: SourceFile): void {
    for (const topLevelDeclaration of sourceFile.topLevelDeclarations) {
      if (topLevelDeclaration instanceof UnboundFunctionDeclaration) {
        if (topLevelDeclaration.decoratorMap.get("export") !== undefined) {
          const entry = topLevelDeclaration.entry;
          if (entry === undefined) {
            throw new Error();
          }
          const task = new AnalyzeGlobalUnboundFunction(entry);
          this.tasks.push(task);
        }
      }
    }
    while (this.tasks.length > 0) {
      const task = this.tasks.pop();
      if (task === undefined) {
        throw new Error();
      }
      if (this.finishedTasks.some((a) => a.equals(task))) {
        continue;
      }
      this.currentTask = task;

      if (task instanceof AnalyzeGlobalUnboundFunction) {
        const declaration = task.entry.declaration as UnboundFunctionDeclaration;
        this.walkUnboundFunctionDeclaration(declaration);
      }
      this.finishedTasks.push(task);
    }
  }
  protected walkTypeExpressionWrapper(typeExpressionWrapper: TypeExpressionWrapper): void {
    const type = typeExpressionWrapper.type;
    if (type === undefined) {
      return;
    }
    const task = new AnalyzeType(type);
    this.tasks.push(task);
  }
  protected walkIdentifierCallExpression(identifierCallExpression: IdentifierCallExpression): void {
    const called = identifierCallExpression.lhs;
    const entry = called.entry;
    if (entry === undefined) {
      return;
    }
    if (entry.entryType === VariableScopeEntryType.globalUnboundFunction) {
      const task = new AnalyzeGlobalUnboundFunction(entry);
      this.tasks.push(task);
    } else {
      console.log("referencing indirect ");
    }
  }
  protected walkBinaryOperatorExpression(binaryOperatorExpression: BinaryOperatorExpression): void {
    super.walkBinaryOperatorExpression(binaryOperatorExpression);
  }
}
