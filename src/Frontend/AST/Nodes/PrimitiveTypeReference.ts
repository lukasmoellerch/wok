import { Token } from "../../Lexer/Token";
import { PrimitiveType } from "../../Type/PrimitiveType";
import { SpecializedTypeReference } from "./SpecializedTypeReference";

export class PrimitiveTypeReference extends SpecializedTypeReference {
  public token: Token;
  public primitiveType: PrimitiveType;
  constructor(token: Token, primitiveType: PrimitiveType) {
    super();
    this.token = token;
    this.primitiveType = primitiveType;
  }
}
