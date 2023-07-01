// src/Wrapper.ts
import { Project as Project2 } from "ts-morph";

// src/wrap.ts
import { AsyncLocalStorage } from "node:async_hooks";
import { Project, ts } from "ts-morph";
var context = new AsyncLocalStorage();
var visitor = {
  JsxElement(node) {
    const maybeSyntaxList = node.getChildAtIndex(1);
    const maybeJsxText = maybeSyntaxList?.getFirstChild();
    const firstRealChildIsJsxText = maybeSyntaxList.isKind(ts.SyntaxKind.SyntaxList) && maybeJsxText?.isKind(ts.SyntaxKind.JsxText);
    if (firstRealChildIsJsxText) {
      if (maybeJsxText.getText().length === 0)
        return;
      const children = maybeSyntaxList.getChildren();
      if (children.length === 1) {
        const child = children[0];
        const text = child.getText().trim();
        if (text.length === 0)
          return;
        wrapText(child);
        context.getStore().push({
          before: text,
          after: child.getText().trim()
        });
        return;
      }
      const shouldUseAllChildren = children.length > 0 && children.every(
        (child) => child.isKind(ts.SyntaxKind.JsxText) || child.isKind(ts.SyntaxKind.JsxExpression)
      );
      if (shouldUseAllChildren) {
        const before = maybeSyntaxList.getText().trim();
        wrapTextWithSubstitutions(maybeSyntaxList);
        const after = maybeSyntaxList.getText().trim();
        context.getStore().push({ before, after });
        return;
      }
      children.forEach((child) => {
        if (child.isKind(ts.SyntaxKind.JsxText)) {
          const text = child.getFullText().trim();
          if (text.length === 0)
            return;
          wrapText(child);
          context.getStore().push({
            before: text,
            after: child.getText().trim()
          });
        }
      });
    }
  }
};
function processFile(sourceFile) {
  sourceFile.forEachDescendant((node) => {
    visitor.visit?.(node);
    visitor[node.getKindName()]?.(node);
  });
}
function getWrapsForFile(sourceFile) {
  const output = [];
  context.run(output, () => {
    processFile(sourceFile);
  });
  return output;
}
function wrapText(node) {
  const text = node.getText().trim();
  node.replaceWithText(`__("${text}")`);
}
function wrapTextWithSubstitutions(node) {
  let text = "";
  const substitutions = /* @__PURE__ */ new Map();
  node.getChildren().forEach((child) => {
    if (child.isKind(ts.SyntaxKind.JsxText)) {
      const childText = child.getText();
      if (childText.length === 0)
        return;
      text += childText;
      return;
    }
    if (child.isKind(ts.SyntaxKind.JsxExpression)) {
      const relevantChildren = child.getChildren().filter(
        (child2) => ![
          ts.SyntaxKind.OpenBraceToken,
          ts.SyntaxKind.CloseBraceToken
        ].includes(child2.getKind())
      );
      if (relevantChildren.length === 0)
        return;
      const isVariable = relevantChildren.length === 1 && relevantChildren[0].isKind(ts.SyntaxKind.Identifier);
      if (isVariable) {
        const variableName = relevantChildren[0].getText().trim();
        if (variableName.length === 0)
          return;
        text += `{{ ${variableName} }}`;
        substitutions.set(variableName, variableName);
        return;
      }
    }
  });
  node.replaceWithText(
    `__("${text}", { substitute: { ${Array.from(substitutions.entries()).map(
      ([key, value]) => key === value ? key : `${key}: ${value}`
    )} }})`
  );
}

// src/Wrapper.ts
var Wrapper = class {
  project;
  sourceFiles;
  currentFileIndex = 0;
  onChange;
  done = false;
  currentFile = null;
  currentWrap = null;
  get filesCount() {
    return this.sourceFiles.length;
  }
  get processedFilesCount() {
    return this.currentFileIndex + 1;
  }
  constructor({ onChange, ...projectOptions }) {
    this.project = new Project2(projectOptions);
    this.sourceFiles = this.project.getSourceFiles();
    this.onChange = onChange;
    if (this.sourceFiles.length === 0) {
      this.done = true;
    }
    this.currentFile = this.processFile();
  }
  processFile() {
    const sourceFile = this.sourceFiles.at(this.currentFileIndex);
    if (!sourceFile)
      return null;
    const wraps = getWrapsForFile(sourceFile);
    return {
      path: sourceFile.getFilePath(),
      wraps
    };
  }
  processNextWrap() {
  }
  next() {
    if (this.done)
      return;
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
};
export {
  Wrapper
};
