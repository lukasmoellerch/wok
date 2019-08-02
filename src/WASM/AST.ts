import * as Constants from "./Encoding/Constants";
import { Expression } from "@babel/types";
export interface IModule {
  sections: Section;
}
export interface IGenericSection {
  sectionId: Constants.Section;
  sizeInBytes: number;
}
export type Section = ICustomSection | IFunctionSection | ITypeSection;
export interface ICustomSection extends IGenericSection {
  sectionId: Constants.Section.custom;
  name: string; // Custom section name
  content: Uint8Array; // Byte Sequence
}
export interface IFunctionType {
  arguments: Constants.ValueType[];
  results: Constants.ValueType[];
}
export interface ITypeSection extends IGenericSection {
  sectionId: Constants.Section.type;
  types: IFunctionType[];
}
export interface IImport {
  module: string;
  name: string;
  description: Constants.ImportDescription;
}
export interface IImportSection extends IGenericSection {
  sectionId: Constants.Section.import;
  imports: IImport[];
}
export interface IFunctionSection extends IGenericSection {
  sectionId: Constants.Section.function;
  functions: number[];
}
export interface ITableSection extends IGenericSection {
  sectionId: Constants.Section.custom;
  table: Constants.TableType[];
}
export interface ILimitWithoutMaximum {
  max: number;
}
export interface ILimit {
  min: number;
  max: number;
}
type Limit = ILimitWithoutMaximum | ILimit;
export interface IMemorySection extends IGenericSection {
  sectionId: Constants.Section.custom;
  memories: Limit[];
}
export interface IGlobal {
  type: Constants.GlobalTypeMutability;
  expression: Expression;
}
export interface IGlobalSection extends IGenericSection {
  sectionId: Constants.Section.global;
  globals: IGlobal[];
}
export interface IExport {
  name: string;
  description: Constants.ExportDescription;
}
export interface IExportSection extends IGenericSection {
  sectionId: Constants.Section.export;
  exports: IExport[];
}
export interface IStartSection extends IGenericSection {
  sectionId: Constants.Section.start;
  start: number; // Function Index
}
export interface IElementSection extends IGenericSection {
  sectionId: Constants.Section.element;
  table: number; // Table index (0)
  offset: Expression;
  init: number[]; // Function indices
}
export interface ILocal {
  n: number;
  type: Constants.ValueType;
}
export interface IFunction {
  locals: ILocal[];
  expression: Expression;
}
export interface ICode {
  size: number;
  code: IFunction;
}
export interface ICodeSection extends IGenericSection {
  sectionId: Constants.Section.code;
  codeEntries: ICode[];
}
export type Expression = Uint8Array;
export type InstructionSequence = Uint8Array;
export interface IMemoryArgument {
  align: number;
  offset: number;
}
