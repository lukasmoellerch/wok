import { TypeScope, TypeScopeEntry } from "../Type Scope/TypeScopeBuilder";
import { NativeIntegerType } from "./NativeType";

export function injectNativeTypes(typeScope: TypeScope) {
  typeScope.addEntry(new TypeScopeEntry("UInt8", new NativeIntegerType(false, 1), undefined));
  typeScope.addEntry(new TypeScopeEntry("UInt16", new NativeIntegerType(false, 2), undefined));
  typeScope.addEntry(new TypeScopeEntry("UInt32", new NativeIntegerType(false, 4), undefined));
  typeScope.addEntry(new TypeScopeEntry("UInt64", new NativeIntegerType(false, 8), undefined));

  typeScope.addEntry(new TypeScopeEntry("Int8", new NativeIntegerType(true, 1), undefined));
  typeScope.addEntry(new TypeScopeEntry("Int16", new NativeIntegerType(true, 2), undefined));
  typeScope.addEntry(new TypeScopeEntry("Int32", new NativeIntegerType(true, 4), undefined));
  typeScope.addEntry(new TypeScopeEntry("Int64", new NativeIntegerType(true, 8), undefined));
}
