import { TypeExpressionWrapper } from "../Type/UnresolvedType/TypeExpressionWrapper";
import { ILValue, ITopLevelDeclaration } from "./AST";
import { AssignmentStatement } from "./Nodes/AssignmentStatement";
import { BinaryOperatorExpression } from "./Nodes/BinaryOperatorExpression";
import { Block } from "./Nodes/Block";
import { ClassDeclaration } from "./Nodes/ClassDeclaration";
import { ConstantDeclaration } from "./Nodes/ConstantDeclaration";
import { ConstantFieldDeclaration } from "./Nodes/ConstantFieldDeclaration";
import { ConstructorCallExpression } from "./Nodes/ConstructorCallExpression";
import { Declaration, DeclarationBlock } from "./Nodes/DeclarationBlock";
import { Decorator } from "./Nodes/Decorator";
import { Expression } from "./Nodes/Expression";
import { ExpressionWrapper } from "./Nodes/ExpressionWrapper";
import { ExtensionDeclaration } from "./Nodes/ExtensionDeclaration";
import { FloatingPointLiteralExpression } from "./Nodes/FloatingPointLiteralExpression";
import { FunctionArgumentDeclaration } from "./Nodes/FunctionArgumentDeclaration";
import { FunctionResultDeclaration } from "./Nodes/FunctionResultDeclaration";
import { IdentifierCallExpression } from "./Nodes/IdentifierCallExpression";
import { IfElseStatement } from "./Nodes/IfElseStatement";
import { IfStatement } from "./Nodes/IfStatement";
import { ImplictConversionExpression } from "./Nodes/ImplictConversionExpression";
import { InfixOperatorDeclaration } from "./Nodes/InfixOperatorDeclaration";
import { IntegerLiteralExpression } from "./Nodes/IntegerLiteralExpression";
import { MemberCallExpression } from "./Nodes/MemberCallExpression";
import { MemberReferenceExpression } from "./Nodes/MemberReferenceExpression";
import { MethodDeclaration } from "./Nodes/MethodDeclaration";
import { PlaceholderExpression } from "./Nodes/PlaceholderExpression";
import { PostfixOperatorDeclaration } from "./Nodes/PostfixOperatorDeclaration";
import { PostfixUnaryOperatorExpression } from "./Nodes/PostfixUnaryOperatorExpression";
import { PrefixOperatorDeclaration } from "./Nodes/PrefixOperatorDeclaration";
import { PrefixUnaryOperatorExpression } from "./Nodes/PrefixUnaryOperatorExpression";
import { ReturnStatement } from "./Nodes/ReturnStatement";
import { SourceFile } from "./Nodes/SourceFile";
import { Statement } from "./Nodes/Statement";
import { StringLiteralExpression } from "./Nodes/StringLiteralExpression";
import { StructDeclaration } from "./Nodes/StructDeclaration";
import { TypeReferenceExpression } from "./Nodes/TypeReferenceExpression";
import { UnboundFunctionDeclaration } from "./Nodes/UnboundFunctionDeclaration";
import { VariableDeclaration } from "./Nodes/VariableDeclaration";
import { VariableFieldDeclaration } from "./Nodes/VariableFieldDeclaration";
import { VariableReferenceExpression } from "./Nodes/VariableReferenceExpression";
import { WhileStatement } from "./Nodes/WhileStatement";

export class ASTWalker {
  public walkSourceFile(sourceFile: SourceFile) {
    for (const delcaration of sourceFile.topLevelDeclarations) {
      this.walkTopLevelDeclaration(delcaration);
    }
  }

  protected walkTopLevelDeclaration(topLevelDeclaration: ITopLevelDeclaration) {
    if (topLevelDeclaration instanceof PrefixOperatorDeclaration) {
      this.walkPrefixOperatorDeclaration(topLevelDeclaration);
      return;
    }
    if (topLevelDeclaration instanceof InfixOperatorDeclaration) {
      this.walkInfixOperatorDeclaration(topLevelDeclaration);
      return;
    }
    if (topLevelDeclaration instanceof PostfixOperatorDeclaration) {
      this.walkPostfixOperatorDeclaration(topLevelDeclaration);
      return;
    }
    if (topLevelDeclaration instanceof UnboundFunctionDeclaration) {
      this.walkUnboundFunctionDeclaration(topLevelDeclaration);
      return;
    }
    if (topLevelDeclaration instanceof StructDeclaration) {
      this.walkStructDeclaration(topLevelDeclaration);
      return;
    }
    if (topLevelDeclaration instanceof ExtensionDeclaration) {
      this.walkExtensionDeclaration(topLevelDeclaration);
      return;
    }
    if (topLevelDeclaration instanceof ClassDeclaration) {
      this.walkClassDeclaration(topLevelDeclaration);
      return;
    }
    if (topLevelDeclaration instanceof Statement) {
      this.walkStatement(topLevelDeclaration);
      return;
    }
    throw new Error();
  }
  protected walkExtensionDeclaration(extensionDeclaration: ExtensionDeclaration) {
    this.walkTypeExpressionWrapper(extensionDeclaration.typeExpression);
    this.walkDeclarationBlock(extensionDeclaration.declarationBlock);
  }
  protected walkStructDeclaration(structDeclaration: StructDeclaration) {
    this.walkDeclarationBlock(structDeclaration.declarationBlock);
  }
  protected walkClassDeclaration(classDeclaration: ClassDeclaration) {
    this.walkDeclarationBlock(classDeclaration.declarationBlock);
  }
  protected walkDeclarationBlock(declarationBlock: DeclarationBlock) {
    for (const declaration of declarationBlock.declarations) {
      this.walkDeclaration(declaration);
    }
  }
  protected walkDeclaration(declaration: Declaration) {
    if (declaration instanceof ConstantFieldDeclaration) {
      this.walkConstantFieldDeclaration(declaration);
      return;
    }
    if (declaration instanceof VariableFieldDeclaration) {
      this.walkVariableFieldDeclaration(declaration);
      return;
    }
    if (declaration instanceof MethodDeclaration) {
      this.walkMethodDeclaration(declaration);
      return;
    }
    throw new Error();
  }
  protected walkConstantFieldDeclaration(constantFieldDeclaration: ConstantFieldDeclaration) {
    this.walkTypeExpressionWrapper(constantFieldDeclaration.typeHint);
  }
  protected walkVariableFieldDeclaration(constantFieldDeclaration: ConstantFieldDeclaration) {
    this.walkTypeExpressionWrapper(constantFieldDeclaration.typeHint);
  }

  protected walkPrefixOperatorDeclaration(_prefixOperatorDeclaration: PrefixOperatorDeclaration) {
    return;
  }
  protected walkInfixOperatorDeclaration(_infixOperatorDeclaration: InfixOperatorDeclaration) {
    return;
  }
  protected walkPostfixOperatorDeclaration(_postfixOperatorDeclaration: PostfixOperatorDeclaration) {
    return;
  }

  protected walkMethodDeclaration(declaration: MethodDeclaration) {
    for (const decorator of declaration.decorators) {
      this.walkDecorator(decorator);
    }
    for (const argumentDeclaration of declaration.argumentDeclarations) {
      this.walkArgumentDeclaration(argumentDeclaration);
    }
    const block = declaration.block;
    if (block !== undefined) {
      this.walkBlock(block);
    }
    const resultDeclaration = declaration.resultDeclaration;
    if (resultDeclaration !== undefined) {
      this.walkResultDeclaration(resultDeclaration);
    }
  }
  protected walkUnboundFunctionDeclaration(unboundFunctionDeclaration: UnboundFunctionDeclaration) {
    for (const decorator of unboundFunctionDeclaration.decorators) {
      this.walkDecorator(decorator);
    }
    for (const argumentDeclaration of unboundFunctionDeclaration.argumentDeclarations) {
      this.walkArgumentDeclaration(argumentDeclaration);
    }
    const block = unboundFunctionDeclaration.block;
    if (block !== undefined) {
      this.walkBlock(block);
    }
    const resultDeclaration = unboundFunctionDeclaration.resultDeclaration;
    if (resultDeclaration !== undefined) {
      this.walkResultDeclaration(resultDeclaration);
    }
  }
  protected walkResultDeclaration(resultDeclaration: FunctionResultDeclaration) {
    this.walkTypeExpressionWrapper(resultDeclaration.type);
  }
  protected walkArgumentDeclaration(argumentDeclaration: FunctionArgumentDeclaration) {
    this.walkTypeExpressionWrapper(argumentDeclaration.type);
  }
  protected walkBlock(block: Block) {
    for (const statement of block.statements) {
      this.walkStatement(statement);
    }
  }
  protected walkStatement(statement: Statement) {
    if (statement instanceof ExpressionWrapper) {
      this.walkExpressionWrapper(statement);
      return;
    }
    if (statement instanceof IfStatement) {
      this.walkIfStatement(statement);
      return;
    }
    if (statement instanceof WhileStatement) {
      this.walkWhileStatement(statement);
      return;
    }
    if (statement instanceof VariableDeclaration) {
      this.walkVariableDeclaration(statement);
      return;
    }
    if (statement instanceof ConstantDeclaration) {
      this.walkConstantDeclaration(statement);
      return;
    }
    if (statement instanceof AssignmentStatement) {
      this.walkAssignmentStatement(statement);
      return;
    }
    if (statement instanceof ReturnStatement) {
      this.walkReturnStatement(statement);
      return;
    }
    if (statement instanceof IfElseStatement) {
      this.walkIfElseStatmment(statement);
      return;
    }
    throw new Error();
  }
  protected walkExpressionWrapper(expressionWrapper: ExpressionWrapper) {
    if (!expressionWrapper.parsed) {
      return;
    }
    if (expressionWrapper.expression instanceof Expression) {
      this.walkExpression(expressionWrapper.expression);
      return;
    }
    if (expressionWrapper.expression instanceof AssignmentStatement) {
      this.walkAssignmentStatement(expressionWrapper.expression);
      return;
    }
    throw new Error();
  }
  protected walkExpression(expression: Expression) {
    if (expression instanceof BinaryOperatorExpression) {
      this.walkBinaryOperatorExpression(expression);
      return;
    }
    if (expression instanceof FloatingPointLiteralExpression) {
      this.walkFloatingPointLiteralExpression(expression);
      return;
    }
    if (expression instanceof IntegerLiteralExpression) {
      this.walkIntegerLiteralExpression(expression);
      return;
    }
    if (expression instanceof PlaceholderExpression) {
      this.walkPlaceholderExpression(expression);
      return;
    }
    if (expression instanceof PostfixUnaryOperatorExpression) {
      this.walkPostfixUnaryOperatorExpression(expression);
      return;
    }
    if (expression instanceof PrefixUnaryOperatorExpression) {
      this.walkPrefixUnaryOperatorExpression(expression);
      return;
    }
    if (expression instanceof VariableReferenceExpression) {
      this.walkVariableReferenceExpression(expression);
      return;
    }
    if (expression instanceof IdentifierCallExpression) {
      this.walkIdentifierCallExpression(expression);
      return;
    }
    if (expression instanceof StringLiteralExpression) {
      this.walkStringLiteralExpression(expression);
      return;
    }
    if (expression instanceof ImplictConversionExpression) {
      this.walkImplictConversionExpression(expression);
      return;
    }
    if (expression instanceof TypeReferenceExpression) {
      this.walkTypeReferenceExpression(expression);
      return;
    }
    if (expression instanceof ConstructorCallExpression) {
      this.walkConstructorCallExpression(expression);
      return;
    }
    if (expression instanceof MemberReferenceExpression) {
      this.walkMemberReferenceExpression(expression);
      return;
    }
    if (expression instanceof MemberCallExpression) {
      this.walkMemberCallExpression(expression);
      return;
    }
    throw new Error();
  }
  protected walkIdentifierCallExpression(identifierCallExpression: IdentifierCallExpression) {
    this.walkVariableReferenceExpression(identifierCallExpression.lhs);
    for (const arg of identifierCallExpression.args) {
      this.walkExpression(arg);
    }
  }
  protected walkStringLiteralExpression(_stringLiteralExpression: StringLiteralExpression) {
    return;
  }
  protected walkImplictConversionExpression(implictConversionExpression: ImplictConversionExpression) {
    this.walkExpression(implictConversionExpression.value);
  }
  protected walkTypeReferenceExpression(_expression: TypeReferenceExpression) {
    return;
  }
  protected walkConstructorCallExpression(constructorCallExpression: ConstructorCallExpression) {
    for (const expression of constructorCallExpression.args) {
      this.walkExpression(expression);
    }
  }
  protected walkMemberReferenceExpression(memberReferenceExpression: MemberReferenceExpression) {
    this.walkExpression(memberReferenceExpression.lhs);
  }
  protected walkMemberCallExpression(memberCallExpression: MemberCallExpression) {
    this.walkExpression(memberCallExpression.lhs);
    for (const arg of memberCallExpression.args) {
      this.walkExpression(arg);
    }
  }
  protected walkIfStatement(ifStatement: IfStatement) {
    this.walkExpressionWrapper(ifStatement.condition);
    this.walkBlock(ifStatement.block);
  }
  protected walkIfElseStatmment(statement: IfElseStatement) {
    this.walkExpressionWrapper(statement.condition);
    this.walkBlock(statement.trueBlock);
    this.walkBlock(statement.falseBlocK);
  }
  protected walkWhileStatement(whileStatement: WhileStatement) {
    this.walkExpressionWrapper(whileStatement.condition);
    this.walkBlock(whileStatement.block);
  }
  protected walkVariableDeclaration(variableDeclaration: VariableDeclaration) {
    if (variableDeclaration.typeHint !== undefined) {
      this.walkTypeExpressionWrapper(variableDeclaration.typeHint);
    }
    this.walkExpressionWrapper(variableDeclaration.value);
  }
  protected walkConstantDeclaration(constantDeclaration: ConstantDeclaration) {
    if (constantDeclaration.typeHint !== undefined) {
      this.walkTypeExpressionWrapper(constantDeclaration.typeHint);
    }
    this.walkExpressionWrapper(constantDeclaration.value);
  }
  protected walkAssignmentStatement(assignmentStatement: AssignmentStatement) {
    this.walkLValue(assignmentStatement.target);
    this.walkExpression(assignmentStatement.value);
  }
  protected walkReturnStatement(returnStatement: ReturnStatement) {
    const value = returnStatement.value;
    if (value !== undefined) {
      this.walkExpressionWrapper(value);
    }
  }
  protected walkLValue(lvalue: ILValue) {
    if (lvalue instanceof VariableReferenceExpression) {
      this.walkVariableReferenceExpression(lvalue);
      return;
    }
    if (lvalue instanceof MemberReferenceExpression) {
      this.walkMemberReferenceExpression(lvalue);
      return;
    }
    return;
  }
  protected walkBinaryOperatorExpression(binaryOperatorExpression: BinaryOperatorExpression) {
    this.walkExpression(binaryOperatorExpression.lhs);
    this.walkExpression(binaryOperatorExpression.rhs);
  }
  protected walkFloatingPointLiteralExpression(_floatingPointLiteralExpression: FloatingPointLiteralExpression) {
    return;
  }
  protected walkIntegerLiteralExpression(_integerLiteralExpression: IntegerLiteralExpression) {
    return;
  }
  protected walkPlaceholderExpression(_placeholderExpression: PlaceholderExpression) {
    return;
  }
  protected walkPostfixUnaryOperatorExpression(_postfixUnaryOperatorExpression: PostfixUnaryOperatorExpression) {
    return;
  }
  protected walkPrefixUnaryOperatorExpression(_prefixUnaryOperatorExpression: PrefixUnaryOperatorExpression) {
    return;
  }
  protected walkVariableReferenceExpression(_variableReferenceExpression: VariableReferenceExpression) {
    return;
  }
  protected walkTypeExpressionWrapper(_typeExpressionWrapper: TypeExpressionWrapper) {
    return;
  }
  protected walkDecorator(decorator: Decorator) {
    for (const parameter of decorator.parameters) {
      this.walkExpressionWrapper(parameter);
    }
  }

}
