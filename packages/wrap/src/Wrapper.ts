import { Project, SourceFile } from "ts-morph";
import { File, Wrap, WrapOptions, getWrapsForFile } from "./wrap";

export type WrapperOptions = WrapOptions & {
  onChange?: () => void;
};

export class Wrapper {
  private project: Project;
  private sourceFiles: SourceFile[];
  private currentFileIndex: number = 0;
  private onChange: WrapperOptions["onChange"];

  public done: boolean = false;
  public currentFile: File | null = null;
  public currentWrap: Wrap | null = null;

  public get filesCount(): number {
    return this.sourceFiles.length;
  }

  public get processedFilesCount(): number {
    return this.currentFileIndex + 1;
  }

  constructor({ onChange, ...projectOptions }: WrapperOptions) {
    this.project = new Project(projectOptions);
    this.sourceFiles = this.project.getSourceFiles();
    this.onChange = onChange;

    if (this.sourceFiles.length === 0) {
      this.done = true;
    }

    this.currentFile = this.processFile();
  }

  public processFile(): File | null {
    const sourceFile = this.sourceFiles.at(this.currentFileIndex);
    if (!sourceFile) return null;

    const wraps = getWrapsForFile(sourceFile);

    return {
      path: sourceFile.getFilePath(),
      wraps,
    };
  }

  public processNextWrap() {}

  public next() {
    if (this.done) return;

    const nextFileIndex = this.currentFileIndex + 1;
    if (nextFileIndex >= this.sourceFiles.length) {
      this.done = true;
      this.onChange?.();
      return;
    }

    this.currentFileIndex = nextFileIndex;
    this.currentFile = this.processFile();
    this.onChange?.();
  }
}
