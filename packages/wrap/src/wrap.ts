import { AsyncLocalStorage } from "node:async_hooks";
import { Node, Project, ts } from "ts-morph";

export type WrapOptions = {
  tsConfigFilePath: string;
};

export type Wrap = {
  before: string;
  after: string;
};

interface BaseFile {
  path: string;
}

export interface UnprocessedFile extends BaseFile {}

export interface ProcessedFile extends BaseFile {
  wraps: Wrap[];
}

export type File = UnprocessedFile | ProcessedFile;

type Visit<NodeType extends ts.Node = ts.Node> = (node: Node<NodeType>) => void;

type Visitor = {
  visit?: Visit;
} & Partial<{
  [type in keyof typeof ts.SyntaxKind]: Visit<ts.Node>;
}>;

const context = new AsyncLocalStorage<Wrap[]>();

const visitor: Visitor = {
  JsxElement(node) {
    const maybeSyntaxList = node.getChildAtIndex(1);
    const maybeJsxText = maybeSyntaxList?.getFirstChild();

    const firstRealChildIsJsxText =
      maybeSyntaxList.isKind(ts.SyntaxKind.SyntaxList) &&
      maybeJsxText?.isKind(ts.SyntaxKind.JsxText);

    if (firstRealChildIsJsxText) {
      if (maybeJsxText.getText().length === 0) return;

      const children = maybeSyntaxList.getChildren();
      if (children.length === 1) {
        const child = children[0];
        const text = child.getText().trim();
        if (text.length === 0) return;

        wrapText(child);
        context.getStore()!.push({
          before: text,
          after: child.getText().trim(),
        });
        return;
      }

      const shouldUseAllChildren =
        children.length > 0 &&
        children.every(
          (child) =>
            child.isKind(ts.SyntaxKind.JsxText) ||
            child.isKind(ts.SyntaxKind.JsxExpression)
        );

      if (shouldUseAllChildren) {
        const before = maybeSyntaxList.getText().trim();
        wrapTextWithSubstitutions(maybeSyntaxList);
        const after = maybeSyntaxList.getText().trim();
        context.getStore()!.push({ before, after });
        return;
      }

      children.forEach((child) => {
        if (child.isKind(ts.SyntaxKind.JsxText)) {
          const text = child.getFullText().trim();
          if (text.length === 0) return;

          wrapText(child);
          context.getStore()!.push({
            before: text,
            after: child.getText().trim(),
          });
        }
      });
    }
  },
};

export function wrapProject({ tsConfigFilePath }: WrapOptions) {
  const project = new Project({
    tsConfigFilePath,
  });

  const sourceFiles = project.getSourceFiles();

  const output: Wrap[] = [];

  context.run(output, () =>
    sourceFiles.forEach((sourceFile) => {
      processFile(sourceFile);
    })
  );

  return output;
}

function processFile(sourceFile: Node<ts.SourceFile>) {
  sourceFile.forEachDescendant((node) => {
    visitor.visit?.(node);
    visitor[node.getKindName() as keyof typeof ts.SyntaxKind]?.(node);
  });
}

export function getWrapsForFile(sourceFile: Node<ts.SourceFile>) {
  const output: Wrap[] = [];

  context.run(output, () => {
    processFile(sourceFile);
  });

  return output;
}

function wrapText<SpecificNode extends Node>(node: SpecificNode) {
  const text = node.getText().trim();

  //   const whiteSpaceBefore = node
  //     .getFullText()
  //     .substring(0, node.getLeadingTriviaWidth());
  //   const whiteSpaceAfter = node
  //     .getFullText()
  //     .substring(node.getLeadingTriviaWidth() + text.length);

  //   node.replaceWithText(whiteSpaceBefore + `__("${text}")` + whiteSpaceAfter);
  node.replaceWithText(`__("${text}")`);
}

function wrapTextWithSubstitutions<SpecificNode extends Node>(
  node: SpecificNode
) {
  let text = "";
  const substitutions = new Map<string, string>();

  node.getChildren().forEach((child) => {
    if (child.isKind(ts.SyntaxKind.JsxText)) {
      const childText = child.getText();
      if (childText.length === 0) return;

      text += childText;
      return;
    }

    if (child.isKind(ts.SyntaxKind.JsxExpression)) {
      const relevantChildren = child
        .getChildren()
        .filter(
          (child) =>
            ![
              ts.SyntaxKind.OpenBraceToken,
              ts.SyntaxKind.CloseBraceToken,
            ].includes(child.getKind())
        );

      if (relevantChildren.length === 0) return;

      const isVariable =
        relevantChildren.length === 1 &&
        relevantChildren[0].isKind(ts.SyntaxKind.Identifier);
      if (isVariable) {
        const variableName = relevantChildren[0].getText().trim();
        if (variableName.length === 0) return;

        text += `{{ ${variableName} }}`;
        substitutions.set(variableName, variableName);

        return;
      }
    }
  });

  node.replaceWithText(
    `__("${text}", { substitute: { ${Array.from(substitutions.entries()).map(
      ([key, value]) => (key === value ? key : `${key}: ${value}`)
    )} }})`
  );
}
