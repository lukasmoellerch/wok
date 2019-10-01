import * as fs from "fs";
import { IFile } from "./IFile";
import { IDirectoryContent, IFileSystemProvider } from "./IFileSystemProvider";
import { IPath } from "./IPath";
export class File implements IFile {
  constructor(public content: ArrayBuffer, public type: string) { }
}
export class Path implements IPath {
  public parts: string[];
  constructor(...parts: string[]) {
    this.parts = parts;
  }
  public appending(component: string) {
    return new Path(...this.parts, component);
  }
}
export class NodeNativeFileSystemProvider implements IFileSystemProvider<Path, File> {
  public async getDirectoryContent(parentPath: Path): Promise<Array<IDirectoryContent<Path>>> {
    const files = await fs.promises.readdir(parentPath.parts.join("/"));
    const results: Array<IDirectoryContent<Path>> = [];
    for await (const file of files) {
      const path = parentPath.appending(file);
      const result = await fs.promises.lstat(path.parts.join("/"));
      const isDir = result.isDirectory();
      results.push({
        type: isDir ? "directory" : "file",
        path,
      });
    }
    return results;
  }
  public async readFile(path: Path): Promise<File> {
    const content = await fs.promises.readFile(path.parts.join("/"));
    const dotParts = path.parts[path.parts.length - 1].split(".");
    return new File(content.buffer, dotParts[dotParts.length - 1]);
  }
  public async writeFile(file: File, path: Path): Promise<void> {
    return await fs.promises.writeFile(path.parts.join("/"), file.content);
  }
}
