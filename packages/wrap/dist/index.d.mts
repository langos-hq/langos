type WrapOptions = {
    tsConfigFilePath: string;
};
type Wrap = {
    before: string;
    after: string;
};
interface BaseFile {
    path: string;
}
interface UnprocessedFile extends BaseFile {
}
interface ProcessedFile extends BaseFile {
    wraps: Wrap[];
}
type File = UnprocessedFile | ProcessedFile;

type WrapperOptions = WrapOptions & {
    onChange?: () => void;
};
declare class Wrapper {
    private project;
    private sourceFiles;
    private currentFileIndex;
    private onChange;
    done: boolean;
    currentFile: File | null;
    currentWrap: Wrap | null;
    get filesCount(): number;
    get processedFilesCount(): number;
    constructor({ onChange, ...projectOptions }: WrapperOptions);
    processFile(): File | null;
    processNextWrap(): void;
    next(): void;
}

export { Wrapper, WrapperOptions };
