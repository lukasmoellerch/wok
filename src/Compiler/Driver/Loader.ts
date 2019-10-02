import { IFile } from "./IFile";
import { IFileSystemProvider } from "./IFileSystemProvider";
import { IPath } from "./IPath";
export class Loader<FileSystemProvider extends IFileSystemProvider<Path, File>, Path extends IPath, File extends IFile> {
  private basePath: Path;
  private fileSystemProvider: FileSystemProvider;
  private libPaths: Path[] = [];
  constructor(basePath: Path, fileSystemProvider: FileSystemProvider) {
    this.basePath = basePath;
    this.fileSystemProvider = fileSystemProvider;
  }
  public async searchForSourceFilesInBasePath(cb: (file: File) => void): Promise<void> {
    await this.searchForSourceFiles(this.basePath, cb);
  }
  private async searchForSourceFiles(path: Path, cb: (file: File) => void): Promise<void> {
    const content = await this.fileSystemProvider.getDirectoryContent(path);
    for await (const child of content) {
      if (child.type === "file") {
        if (child.path.parts[child.path.parts.length - 1].indexOf("wok") === -1) {
          continue;
        }
        const file = await this.fileSystemProvider.readFile(child.path);
        if (file.type === "wok") {
          cb(file);
        }
      } else {
        if (child.path.parts[child.path.parts.length - 1] === "lib") {
          this.libPaths.push(child.path);
          continue;
        }
        await this.searchForSourceFiles(child.path, cb);
      }
    }
  }
}
