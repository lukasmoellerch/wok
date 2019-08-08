import { Expression, ICodeSection, ICustomSection, IDataSection, IDataSegment, IElement, IElementSection, IExport, IExportSection, IFunction, IFunctionSection, IFunctionType, IGlobal, IGlobalSection, IImport, IImportSection, ILimit, ILocal, IMemorySection, IModule, IStartSection, ITableSection, ITableType, ITypeSection, Section } from './AST';
import { functionTypesAreEqual } from "./ASTUtils";
import { ExportDescription, GlobalTypeMutability, ImportDescription, Instruction, Section as SectionId, ValueType } from "./Encoding/Constants";
import { encodeModule } from "./Encoding/Encoder";
import { InstructionSequenceBuilder } from "./Encoding/InstructionSequenceBuilder";
import { TypedArrayBytestreamConsumer } from "./Encoding/TypedArrayBytestreamConsumer";

export class ASTBuilder {
  private sections: Section[] = [];
  private defaultTypeSection: ITypeSection | null = null;
  private defaultFunctionSection: IFunctionSection | null = null;
  private defaultCodeSection: ICodeSection | null = null;
  private defaultExportSection: IExportSection | null = null;
  private defaultImportSection: IImportSection | null = null;
  private defaultTableSection: ITableSection | null = null;
  private defaultGlobalSection: IGlobalSection | null = null;
  private defaultStartSection: IStartSection | null = null;
  private defaultElementSection: IElementSection | null = null;
  private defaultDataSection: IDataSection | null = null;
  public get module(): IModule {
    return {
      sections: this.sections,
    } as IModule;
  }
  public get encodedModule(): Uint8Array {
    const consumer = new TypedArrayBytestreamConsumer();
    encodeModule(this.module, consumer);
    return consumer.cleanArray;
  }
  public addCustomSection(name: string, content: Uint8Array): ICustomSection {
    const section: ICustomSection = {
      sectionId: SectionId.custom,
      name,
      content,
    };
    this.sections.push(section);
    return section;
  }
  public addTypeSection(types: IFunctionType[] = []): ITypeSection {
    const section: ITypeSection = {
      sectionId: SectionId.type,
      types,
    };
    if (this.defaultTypeSection === null) {
      this.defaultTypeSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public functionTypeIndex(args: ValueType[], result?: ValueType): number {
    const typeSection = this.defaultTypeSection || this.addTypeSection();
    const functionType: IFunctionType = {
      arguments: args,
      results: result ? [result] : [],
    };
    const index = typeSection.types.findIndex((value) => {
      return functionTypesAreEqual(value, functionType);
    });
    if (index !== -1) {
      return index;
    }
    typeSection.types.push(functionType);
    return typeSection.types.length - 1;
  }
  public addFunctionSection(functions: number[] = []): IFunctionSection {
    const section: IFunctionSection = {
      sectionId: SectionId.function,
      functions,
    };
    if (this.defaultTypeSection === null) {
      this.defaultFunctionSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addCodeSection(codeEntries: IFunction[] = []): ICodeSection {
    const section: ICodeSection = {
      sectionId: SectionId.code,
      codeEntries,
    };
    if (this.defaultTypeSection === null) {
      this.defaultCodeSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addExportSection(e: IExport[] = []): IExportSection {
    const section: IExportSection = {
      sectionId: SectionId.export,
      exports: e,
    };
    if (this.defaultTypeSection === null) {
      this.defaultExportSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addFunction(i: number, exportedAs: string | null, type: number, locals: ILocal[], expression: Uint8Array): number {
    const functionSection = this.defaultFunctionSection || this.addFunctionSection();
    if (exportedAs !== null) {
      const exportSection = this.defaultExportSection || this.addExportSection();
      exportSection.exports.push({
        name: exportedAs,
        description: {
          type: ExportDescription.function,
          index: i,
        },
      });
    }
    const codeSection = this.defaultCodeSection || this.addCodeSection();
    functionSection.functions.push(type);
    codeSection.codeEntries.push({
      locals,
      expression,
    });
    const index = codeSection.codeEntries.length - 1;
    return index;
  }
  public addImportSection(imports: IImport[] = []): IImportSection {
    const section: IImportSection = {
      sectionId: SectionId.import,
      imports,
    };
    if (this.defaultImportSection === null) {
      this.defaultImportSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addFunctionImport(module: string, name: string, type: number) {
    const section = this.defaultImportSection || this.addImportSection();
    section.imports.push({
      module,
      name,
      description: {
        type: ImportDescription.function,
        functionType: type,
      },
    });
  }
  public addTableSection(table: ITableType[] = []): ITableSection {
    const section: ITableSection = {
      sectionId: SectionId.table,
      table,
    };
    if (this.defaultTableSection === null) {
      this.defaultTableSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addGlobalSection(globals: IGlobal[] = []): IGlobalSection {
    const section: IGlobalSection = {
      sectionId: SectionId.global,
      globals,
    };
    if (this.defaultGlobalSection === null) {
      this.defaultGlobalSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addStartSection(start: number = -1): IStartSection {
    const section: IStartSection = {
      sectionId: SectionId.start,
      start,
    };
    if (this.defaultStartSection === null) {
      this.defaultStartSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addElementSection(elements: IElement[] = []): IElementSection {
    const section: IElementSection = {
      sectionId: SectionId.element,
      elements,
    };
    if (this.defaultElementSection === null) {
      this.defaultElementSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addDataSection(segments: IDataSegment[] = []): IDataSection {
    const section: IDataSection = {
      sectionId: SectionId.data,
      segments,
    };
    if (this.defaultDataSection === null) {
      this.defaultDataSection = section;
    }
    this.sections.push(section);
    return section;
  }
  public addGlobal(type: ValueType, mutability: GlobalTypeMutability, expression: Expression): number {
    const section = this.defaultGlobalSection || this.addGlobalSection();
    section.globals.push({ type: { type, mutability }, expression });
    return section.globals.length - 1;
  }
  public addI32Global(mutabiltiy: GlobalTypeMutability, c: number): number {
    const builder = new InstructionSequenceBuilder();
    builder.i32Const(c);
    builder.consumer.write(Instruction.blockend);
    const buffer = builder.instructions;
    return this.addGlobal(ValueType.i32, mutabiltiy, buffer);
  }
  public addI64Global(mutabiltiy: GlobalTypeMutability, c: number): number {
    const builder = new InstructionSequenceBuilder();
    builder.i64Const(c);
    builder.consumer.write(Instruction.blockend);
    const buffer = builder.instructions;
    return this.addGlobal(ValueType.i64, mutabiltiy, buffer);
  }
  public addF32Global(mutabiltiy: GlobalTypeMutability, c: number): number {
    const builder = new InstructionSequenceBuilder();
    builder.f32Const(c);
    builder.consumer.write(Instruction.blockend);
    const buffer = builder.instructions;
    return this.addGlobal(ValueType.f32, mutabiltiy, buffer);
  }
  public addF64Global(mutabiltiy: GlobalTypeMutability, c: number): number {
    const builder = new InstructionSequenceBuilder();
    builder.f64Const(c);
    builder.consumer.write(Instruction.blockend);
    const buffer = builder.instructions;
    return this.addGlobal(ValueType.f64, mutabiltiy, buffer);
  }
  public addMemorySection(memories: ILimit[]): IMemorySection {
    const section: IMemorySection = {
      sectionId: SectionId.memory,
      memories,
    };
    this.sections.push(section);
    return section;
  }
}
