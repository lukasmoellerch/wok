import { IFile } from "./IFile";
import { IPath } from "./IPath";

export interface IDirectoryContent<Path extends IPath> {
  type: "file" | "directory";
  path: Path;
}
export interface IFileSystemProvider<Path extends IPath, File extends IFile> {
  getDirectoryContent(path: Path): Promise<Array<IDirectoryContent<Path>>>;
  readFile(path: Path): Promise<File>;
  writeFile(file: File, path: Path): Promise<void>;
}
