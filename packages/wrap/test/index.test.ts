import { expect, test } from "vitest";
import path from "node:path";
import { wrapProject } from "../src/wrap";
import { Wrapper } from "../src/Wrapper";

test("wrap", () => {
  expect(
    wrapProject({
      tsConfigFilePath: path.resolve(
        __dirname,
        "../../../fixtures/react-vite-typescript/tsconfig.json"
      ),
    })
  ).toMatchInlineSnapshot(`
    [
      {
        "after": "__(\\"Vite + React\\")",
        "before": "Vite + React",
      },
      {
        "after": "__(\\"count is {{ count }}\\", { substitute: { count }})",
        "before": "count is {count}",
      },
      {
        "after": "__(\\"Edit\\")",
        "before": "Edit",
      },
      {
        "after": "__(\\"and save to test HMR\\")",
        "before": "and save to test HMR",
      },
      {
        "after": "__(\\"src/App.tsx\\")",
        "before": "src/App.tsx",
      },
      {
        "after": "__(\\"Click on the Vite and React logos to learn more\\")",
        "before": "Click on the Vite and React logos to learn more",
      },
    ]
  `);
});
