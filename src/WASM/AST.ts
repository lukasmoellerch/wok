import * as Constants from "./Encoding/Constants";
import { Limit as LimitType, TableType } from "./Encoding/Constants";
export interface IModule {
  sections: Section[];
}
export interface IGenericSection { }
export type Section =
  | ICustomSection
  | IFunctionSection
  | ITypeSection
  | IImportSection
  | IMemorySection
  | ITableSection
  | IGlobalSection
  | IExportSection
  | IStartSection
  | IElementSection
  | ICodeSection
  | IDataSection;
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
export interface IFunctionImport {
  type: Constants.ImportDescription.function;
  functionType: number;
}
export interface ITableType {
  elementType: TableType;
  limits: Limit;
}
export interface ITableImport {
  type: Constants.ImportDescription.table;
  tableType: ITableType;
}
export interface IMemoryImport {
  type: Constants.ImportDescription.memory;
  memoryType: Limit;
}
export interface IGlobalImport {
  type: Constants.ImportDescription.global;
  globalType: IGlobalType;
}
export type ImportDescription =
  | IFunctionImport
  | ITableImport
  | IMemoryImport
  | IGlobalImport;
export interface IImport {
  module: string;
  name: string;
  description: ImportDescription;
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
  sectionId: Constants.Section.table;
  table: ITableType[];
}
export interface ILimitWithoutMaximum {
  kind: LimitType.minimum;
  min: number;
}
export interface ILimit {
  kind: LimitType.minimumAndMaximum;
  min: number;
  max: number;
}
export type Limit = ILimitWithoutMaximum | ILimit;
export interface IMemorySection extends IGenericSection {
  sectionId: Constants.Section.memory;
  memories: Limit[];
}
export interface IGlobalType {
  type: Constants.ValueType;
  mutability: Constants.GlobalTypeMutability;
}
export interface IGlobal {
  type: IGlobalType;
  expression: Expression;
}
export interface IGlobalSection extends IGenericSection {
  sectionId: Constants.Section.global;
  globals: IGlobal[];
}
export interface IFunctionExport {
  type: Constants.ExportDescription.function;
  index: number;
}
export interface ITableExport {
  type: Constants.ExportDescription.table;
  index: number;
}
export interface IMemoryExport {
  type: Constants.ExportDescription.memory;
  index: number;
}
export interface IGlobalExport {
  type: Constants.ExportDescription.global;
  index: number;
}
export type Export =
  | IFunctionExport
  | ITableExport
  | IMemoryExport
  | IGlobalExport;
export interface IExport {
  name: string;
  description: Export;
}
export interface IExportSection extends IGenericSection {
  sectionId: Constants.Section.export;
  exports: IExport[];
}
export interface IStartSection extends IGenericSection {
  sectionId: Constants.Section.start;
  start: number; // Function Index
}
export interface IElement {
  table: number; // Table index (0)
  offset: Expression;
  init: number[]; // Function indices
}
export interface IElementSection extends IGenericSection {
  sectionId: Constants.Section.element;
  elements: IElement[];
}
export interface ILocal {
  n: number;
  type: Constants.ValueType;
}
export interface IFunction {
  locals: ILocal[];
  expression: Expression;
}
export interface ICodeSection extends IGenericSection {
  sectionId: Constants.Section.code;
  codeEntries: IFunction[];
}
export type Expression = Uint8Array;
export type InstructionSequence = Uint8Array;
export interface IMemoryArgument {
  align: number;
  offset: number;
}
export interface IDataSegment {
  memIndex: number;
  offset: Expression;
  data: Uint8Array;
}
export interface IDataSection extends IGenericSection {
  sectionId: Constants.Section.data;
  segments: IDataSegment[];
}
