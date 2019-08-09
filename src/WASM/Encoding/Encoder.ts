import { IFunctionType, IGlobalType, IModule, ITableType, Limit, Section } from "../AST";
import { functionByte, ImportDescription, Limit as LimitType, magicString, ResultType, Section as SectionId, version } from "./Constants";
import { IBytestreamConsumer } from "./IBytestreamConsumer";
import { TypedArrayBytestreamConsumer } from "./TypedArrayBytestreamConsumer";
import { encodeName, encodeNumberAsUnsignedLEB128, encodeUTF8String } from "./Utils";
export function encodeModule(module: IModule, consumer: IBytestreamConsumer) {
  encodeUTF8String(magicString, consumer);
  consumer.write([version], 4);

  for (const section of module.sections) {
    encodeSection(section, consumer);
  }
}
export function encodeSection(section: Section, consumer: IBytestreamConsumer) {
  consumer.write(section.sectionId);
  const sectionBuffer = new TypedArrayBytestreamConsumer();

  if (section.sectionId === SectionId.custom) {
    encodeName(section.name, sectionBuffer);
    sectionBuffer.write([...section.content]);
  } else if (section.sectionId === SectionId.type) {
    encodeNumberAsUnsignedLEB128(section.types.length, sectionBuffer);
    for (const type of section.types) {
      encodeFunctionType(type, sectionBuffer);
    }
  } else if (section.sectionId === SectionId.import) {
    encodeNumberAsUnsignedLEB128(section.imports.length, sectionBuffer);
    for (const imp of section.imports) {
      encodeName(imp.module, sectionBuffer);
      encodeName(imp.name, sectionBuffer);
      const description = imp.description;
      sectionBuffer.write(description.type);
      if (description.type === ImportDescription.function) {
        encodeNumberAsUnsignedLEB128(description.functionType, sectionBuffer);
      } else if (description.type === ImportDescription.global) {
        encodeGlobalType(description.globalType, sectionBuffer);
      } else if (description.type === ImportDescription.memory) {
        encodeLimits(description.memoryType, sectionBuffer);
      } else if (description.type === ImportDescription.table) {
        encodeTableType(description.tableType, sectionBuffer);
      }
    }
  } else if (section.sectionId === SectionId.function) {
    encodeNumberAsUnsignedLEB128(section.functions.length, sectionBuffer);
    for (const fun of section.functions) {
      encodeNumberAsUnsignedLEB128(fun, sectionBuffer);
    }
  } else if (section.sectionId === SectionId.table) {
    encodeNumberAsUnsignedLEB128(section.table.length, sectionBuffer);
    for (const t of section.table) {
      encodeTableType(t, sectionBuffer);
    }
  } else if (section.sectionId === SectionId.memory) {
    encodeNumberAsUnsignedLEB128(section.memories.length, sectionBuffer);
    for (const mem of section.memories) {
      encodeLimits(mem, sectionBuffer);
    }
  } else if (section.sectionId === SectionId.global) {
    encodeNumberAsUnsignedLEB128(section.globals.length, sectionBuffer);
    for (const g of section.globals) {
      encodeGlobalType(g.type, sectionBuffer);
      sectionBuffer.write([...g.expression]);
    }
  } else if (section.sectionId === SectionId.export) {
    encodeNumberAsUnsignedLEB128(section.exports.length, sectionBuffer);
    for (const e of section.exports) {
      encodeName(e.name, sectionBuffer);
      const description = e.description;
      sectionBuffer.write(description.type);
      sectionBuffer.write(description.index);
    }
  } else if (section.sectionId === SectionId.start) {
    encodeNumberAsUnsignedLEB128(section.start, sectionBuffer);
  } else if (section.sectionId === SectionId.element) {
    encodeNumberAsUnsignedLEB128(section.elements.length, sectionBuffer);
    for (const element of section.elements) {
      encodeNumberAsUnsignedLEB128(element.table, sectionBuffer);
      sectionBuffer.write([...element.init]);
      encodeNumberAsUnsignedLEB128(element.init.length, sectionBuffer);
      for (const index of element.init) {
        encodeNumberAsUnsignedLEB128(index, sectionBuffer);
      }
    }
  } else if (section.sectionId === SectionId.code) {
    encodeNumberAsUnsignedLEB128(section.codeEntries.length, sectionBuffer);
    for (const code of section.codeEntries) {
      const buffer = new TypedArrayBytestreamConsumer();
      encodeNumberAsUnsignedLEB128(code.locals.length, buffer);
      for (const local of code.locals) {
        encodeNumberAsUnsignedLEB128(local.n, buffer);
        buffer.write(local.type);
      }
      buffer.write([...code.expression]);
      encodeNumberAsUnsignedLEB128(buffer.writtenBytes, sectionBuffer);
      sectionBuffer.append(buffer);
    }
  } else if (section.sectionId === SectionId.data) {
    encodeNumberAsUnsignedLEB128(section.segments.length, sectionBuffer);
    for (const segment of section.segments) {
      encodeNumberAsUnsignedLEB128(segment.memIndex, sectionBuffer);
      sectionBuffer.write([...segment.offset]);
      encodeNumberAsUnsignedLEB128(segment.data.length, sectionBuffer);
      sectionBuffer.write([...segment.data]);
    }
  }
  encodeNumberAsUnsignedLEB128(sectionBuffer.writtenBytes, consumer);
  consumer.append(sectionBuffer);
}
export function encodeResultType(
  type: ResultType,
  consumer: IBytestreamConsumer,
): void {
  consumer.write(type);
}
export function encodeFunctionType(
  type: IFunctionType,
  consumer: IBytestreamConsumer,
): void {
  consumer.write(functionByte);
  encodeNumberAsUnsignedLEB128(type.arguments.length, consumer);
  for (const argumentType of type.arguments) {
    consumer.write(argumentType);
  }
  encodeNumberAsUnsignedLEB128(type.results.length, consumer);
  for (const resultType of type.results) {
    consumer.write(resultType);
  }
}
export function encodeLimits(
  limit: Limit,
  consumer: IBytestreamConsumer,
): void {
  consumer.write(limit.kind);
  if (limit.kind === LimitType.minimum) {
    encodeNumberAsUnsignedLEB128(limit.min, consumer);
  } else {
    encodeNumberAsUnsignedLEB128(limit.min, consumer);
    encodeNumberAsUnsignedLEB128(limit.max, consumer);
  }
}
export function encodeTableType(
  tableType: ITableType,
  consumer: IBytestreamConsumer,
): void {
  consumer.write(tableType.elementType);
  encodeLimits(tableType.limits, consumer);
}
export function encodeGlobalType(
  globalType: IGlobalType,
  consumer: IBytestreamConsumer,
): void {
  consumer.write(globalType.type);
  consumer.write(globalType.mutability);
}
