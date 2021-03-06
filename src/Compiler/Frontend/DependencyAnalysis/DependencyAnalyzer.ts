import { ASTWalker } from "../AST/ASTWalker";
import { GenericTypeVariableScope, ITypeCheckingType } from "../AST/ExpressionType";
import { BinaryOperatorExpression } from "../AST/Nodes/BinaryOperatorExpression";
import { ConstructorCallExpression } from "../AST/Nodes/ConstructorCallExpression";
import { IdentifierCallExpression } from "../AST/Nodes/IdentifierCallExpression";
import { MemberCallExpression } from "../AST/Nodes/MemberCallExpression";
import { MemberReferenceExpression } from "../AST/Nodes/MemberReferenceExpression";
import { PostfixUnaryOperatorExpression } from "../AST/Nodes/PostfixUnaryOperatorExpression";
import { PrefixUnaryOperatorExpression } from "../AST/Nodes/PrefixUnaryOperatorExpression";
import { SourceFile } from "../AST/Nodes/SourceFile";
import { Statement } from "../AST/Nodes/Statement";
import { UnboundFunctionDeclaration } from "../AST/Nodes/UnboundFunctionDeclaration";
import { VariableReferenceExpression } from "../AST/Nodes/VariableReferenceExpression";
import { CircularTypeError, CompilerError } from "../ErrorHandling/CompilerError";
import { CompileConstructor, CompileMethod, CompileOperator, CompilerTask, CompileStart, CompileUnboundFunctionTask } from "../IRCompilation/CompilerTask";
import { TypeProvider } from "../Type Scope/TypeProvider";
import { ClassType } from "../Type/ClassType";
import { FunctionType } from "../Type/FunctionType";
import { StructType } from "../Type/StructType";
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
  start,
}
class AnalyzerTaskBase {
  public indirectlyReferenced: boolean = false;
  public equals(_other: Task): boolean {
    throw new Error();
  }
  public toString(): string {
    return "[BASE]";
  }
}
class AnalyzeStart extends AnalyzerTaskBase {
  public sourceFile: SourceFile;
  constructor(sourceFile: SourceFile) {
    super();
    this.sourceFile = sourceFile;
  }
  public equals(other: Task): boolean {
    if (!(other instanceof AnalyzeStart)) {
      return false;
    }
    return other.sourceFile === this.sourceFile;
  }
  public toString(): string {
    return `[START]`;
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
    if (this.type !== other.type) {
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
    if (this.type === other.type) {
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
    if (this.type !== other.type) {
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
    if (this.type !== other.type) {
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
class AnalyzeMember extends AnalyzerTaskBase {
  public taskType = AnalyzerTaskType.property;
  public type: IType;
  public memberName: string;
  constructor(type: IType, memberName: string) {
    super();
    this.type = type;
    this.memberName = memberName;
  }
  public equals(other: Task): boolean {
    if (!(other instanceof AnalyzeMember)) {
      return false;
    }
    if (this.type !== other.type) {
      return false;
    }
    if (this.memberName !== other.memberName) {
      return false;
    }
    return true;
  }
  public toString(): string {
    return `[MEMBER] ${this.type.toString()} ${this.memberName}`;
  }
}
type Task = AnalyzerTaskBase;

export class DependencyAnalyzer extends ASTWalker {

  public compilerTasks: CompilerTask[] = [];
  public indirectlyReferencedTask: Task[] = [];
  protected genericTypeVariableScopeStack: GenericTypeVariableScope[] = [new GenericTypeVariableScope()];
  private typeArray: IType[] = [];
  private typeMapIndexMapping: Map<IType, number> = new Map();
  private memoryDependencies: Map<number, Set<IType>> = new Map(); // A has every B as a dependency
  private dependenciesOfType: Map<IType, Set<number>> = new Map(); // A is a dependency of every B

  private finishedTasks: Task[] = [];
  private tasks: Task[] = [];
  private currentTask: Task | undefined;
  private typeProvider = new TypeProvider();
  constructor(private errors: CompilerError[]) {
    super();
  }
  public analyze(sourceFile: SourceFile, typeProvider: TypeProvider): void {
    this.typeProvider = typeProvider;
    for (const topLevelDeclaration of sourceFile.topLevelDeclarations) {
      if (topLevelDeclaration instanceof UnboundFunctionDeclaration) {
        if (topLevelDeclaration.decoratorMap.get("export") !== undefined
          || topLevelDeclaration.decoratorMap.get("compile") !== undefined) {
          const entry = topLevelDeclaration.entry;
          if (entry === undefined) {
            throw new Error();
          }
          const task = new AnalyzeGlobalUnboundFunction(entry);
          this.tasks.push(task);
        }
      }
    }
    this.tasks.push(new AnalyzeStart(sourceFile));
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
      } else if (task instanceof AnalyzeType) {
        const type =
          task.type;
        const index = this.typeArray.length;
        this.typeMapIndexMapping.set(type, index);
        this.typeArray.push(type);
        for (const childType of type.typeReferences()) {
          const subtask = new AnalyzeType(childType);
          this.tasks.push(subtask);
        }
        this.memoryDependencies.set(index, type.memoryReferences());
      } else if (task instanceof AnalyzeConstructor) {
        const typeTask = new AnalyzeType(task.type);
        this.tasks.push(typeTask);
      } else if (task instanceof AnalyzeOperator) {
        // Do nothing
      } else if (task instanceof AnalyzeMember) {
        const type = task.type;
        if (type instanceof StructType) {
          const declaration = type.methodDeclarationMap.get(task.memberName);
          if (declaration !== undefined) {
            this.genericTypeVariableScopeStack.push(type.genericVariableScope);
            this.walkMethodDeclaration(declaration);
          }
        } else if (type instanceof ClassType) {
          const declaration = type.methodDeclarationMap.get(task.memberName);
          if (declaration !== undefined) {
            // this.genericTypeVariableScopeStack.push(type.genericVariableScope);
            this.walkMethodDeclaration(declaration);
          }
        }
      } else if (task instanceof AnalyzeStart) {
        for (const statement of sourceFile.topLevelDeclarations) {
          if (!(statement instanceof Statement)) {
            continue;
          }
          this.walkStatement(statement);
        }
      }
      this.finishedTasks.push(task);
    }
    for (const dependencies of this.memoryDependencies.entries()) {
      for (const type of dependencies[1].values()) {

        const set = this.dependenciesOfType.get(type) || new Set();
        if (set.size === 0) {
          this.dependenciesOfType.set(type, set);
        }
        set.add(dependencies[0]);
      }
    }
    let i = 0;
    for (const type of this.typeArray) {
      if (!this.dependenciesOfType.has(type)) {
        this.dependenciesOfType.set(type, new Set());
      }
      if (!this.memoryDependencies.has(i)) {
        this.memoryDependencies.set(i, new Set());
      }
      i++;
    }
    let found = false;
    do {
      found = false;
      for (const [typeIndex, missingDependencies] of this.memoryDependencies.entries()) {
        const type = this.typeArray[typeIndex];
        if (missingDependencies.size === 0) {
          found = true;
          if (type instanceof StructType) {
            type.resolveLayout();
          } else if (type instanceof ClassType) {
            type.resolveLayout();
          }
          for (const t of (this.dependenciesOfType.get(type) || new Set()).values()) {
            const memoryDependencies = this.memoryDependencies.get(t);
            if (memoryDependencies !== undefined) {
              memoryDependencies.delete(type);
            }
          }
          this.memoryDependencies.delete(typeIndex);
        }
      }
    } while (found);
    if (this.memoryDependencies.size > 0) {
      for (const circularTypeIndex of this.memoryDependencies.keys()) {
        const type = this.typeArray[circularTypeIndex];
        if (type instanceof StructType) {
          const dependencies = this.memoryDependencies.get(circularTypeIndex);
          if (dependencies === undefined) {
            throw new Error();
          }
          this.errors.push(new CircularTypeError(type.declaration.nameToken.range, type.toString(), [...dependencies.values()].map((a) => a.toString())));
        } else {
          throw new Error();
        }
      }
    }
    this.compilerTasks.push(new CompileStart(sourceFile));
    for (const task of this.finishedTasks) {
      if (task instanceof AnalyzeGlobalUnboundFunction) {
        const declaration = task.entry.declaration as UnboundFunctionDeclaration;
        this.compilerTasks.push(new CompileUnboundFunctionTask(declaration));
      } else if (task instanceof AnalyzeConstructor) {
        this.compilerTasks.push(new CompileConstructor(task.type));
      } else if (task instanceof AnalyzeOperator) {
        this.compilerTasks.push(new CompileOperator(task.type, task.operator, task.arity));
      } else if (task instanceof AnalyzeMember) {
        const type = task.type;
        const memberType = type.typeOfMember(task.memberName);
        if (memberType instanceof FunctionType) {
          this.compilerTasks.push(new CompileMethod(task.type, task.memberName, memberType.args.length));
        }
      }
      if (this.indirectlyReferencedTask.some((other) => other.equals(task))) {
        this.compilerTasks[this.compilerTasks.length - 1].indirectlyReferenced = true;
      }
    }
  }
  protected walkTypeExpressionWrapper(typeExpressionWrapper: TypeExpressionWrapper): void {
    const typeCheckingType = typeExpressionWrapper.type;
    if (typeCheckingType === undefined) {
      return;
    }
    try {
      const type = this.getCompilationType(typeCheckingType);

      const task = new AnalyzeType(type);
      this.tasks.push(task);
    } catch (e) {
      return;
    }

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
      for (const arg of identifierCallExpression.args) {
        this.walkExpression(arg);
      }
      return;
    }
    super.walkIdentifierCallExpression(identifierCallExpression);
  }
  protected walkBinaryOperatorExpression(binaryOperatorExpression: BinaryOperatorExpression): void {
    super.walkBinaryOperatorExpression(binaryOperatorExpression);
    const lhs = binaryOperatorExpression.lhs;
    const type = lhs.forceType();
    try {
      const task = new AnalyzeOperator(this.getCompilationType(type), binaryOperatorExpression.operator.content, 2);
      this.tasks.push(task);
    } catch (_e) {
      return;
    }
  }
  protected walkPrefixUnaryOperatorExpression(prefixUnaryOperatorExpression: PrefixUnaryOperatorExpression): void {
    super.walkPrefixUnaryOperatorExpression(prefixUnaryOperatorExpression);
  }
  protected walkPostfixUnaryOperatorExpression(postfixUnaryOperatorExpression: PostfixUnaryOperatorExpression): void {
    super.walkPostfixUnaryOperatorExpression(postfixUnaryOperatorExpression);
  }
  protected walkMemberCallExpression(memberCallExpression: MemberCallExpression): void {
    super.walkMemberCallExpression(memberCallExpression);
    const type = memberCallExpression.lhs.forceType();
    try {
      const t = this.getCompilationType(type);
      const task = new AnalyzeMember(t, memberCallExpression.memberToken.content);
      this.tasks.push(task);
    } catch (_e) {
      return;
    }
  }
  protected walkMemberReferenceExpression(memberReferenceExpression: MemberReferenceExpression): void {
    super.walkMemberReferenceExpression(memberReferenceExpression);
    const type = memberReferenceExpression.lhs.forceType();
    try {
      const task = new AnalyzeMember(this.getCompilationType(type), memberReferenceExpression.memberToken.content);
      this.tasks.push(task);
    } catch (_e) {
      return;
    }
  }
  protected walkConstructorCallExpression(constructorCallExpression: ConstructorCallExpression): void {
    super.walkConstructorCallExpression(constructorCallExpression);
    const called = constructorCallExpression.constructedType;
    try {
      const compilationType = this.getCompilationType(called);
      const task = new AnalyzeConstructor(compilationType, constructorCallExpression.args.length);
      this.tasks.push(task);
    } catch (e) {
      return;
    }

  }
  protected walkVariableReferenceExpression(variableReferenceExpression: VariableReferenceExpression): void {
    const entry = variableReferenceExpression.entry;
    if (entry === undefined) {
      return;
    }
    const entryType = entry.entryType;
    if (entryType !== VariableScopeEntryType.globalUnboundFunction) {
      return;
    }
    const task = new AnalyzeGlobalUnboundFunction(entry);
    this.tasks.push(task);
    this.indirectlyReferencedTask.push(task);
  }
  private getCompilationType(type: ITypeCheckingType): IType {
    return this.typeProvider.get(type.compilationType(this.typeProvider, this.genericTypeVariableScopeStack[this.genericTypeVariableScopeStack.length - 1]));
  }
}
