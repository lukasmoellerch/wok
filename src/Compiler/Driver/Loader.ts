import { IFile } from "./IFile";
import { IFileSystemProvider } from "./IFileSystemProvider";
import { IPath } from "./IPath";
export class Loader<FileSystemProvider extends IFileSystemProvider<Path, File>, Path extends IPath, File extends IFile> {
  private basePath: Path;
  private fileSystemProvider: FileSystemProvider;
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
        const file = await this.fileSystemProvider.readFile(child.path);
        if (file.type === "wok") {
          cb(file);
        }
      } else {
        await this.searchForSourceFiles(child.path, cb);
      }
    }
  }
}
