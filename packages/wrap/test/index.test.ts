import { expect, test } from "vitest";
import path from "node:path";
import { wrap } from "../src";

test("wrap", () => {
  expect(
    wrap({
      tsConfigFilePath: path.resolve(
        __dirname,
        "../../../fixtures/react-vite-typescript/tsconfig.json"
      ),
    })
  ).toMatchInlineSnapshot(`
    [
      "__(\\"Vite + React\\")",
      "__(\\"count is {{ count }}\\", { substitute: { count }})",
      "__(\\"Edit\\")",
      "__(\\"and save to test HMR\\")",
      "__(\\"src/App.tsx\\")",
      "__(\\"Click on the Vite and React logos to learn more\\")",
    ]
  `);
});
