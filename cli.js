#!/usr/bin/env node

require = require("esm")(module)

const meow = require("meow")
const build = require("./lib/build").default
const serve = require("./lib/serve").default

const cli = meow(
  `
  Usage
    ❯ charge serve <source directory>
    ❯ charge build <source directory> <target directory>
`,
)

let command = cli.input[0]

switch (command) {
  case undefined:
    return cli.showHelp()
  case "build":
    let buildCLI = meow(
      `
Usage
  ❯ charge build <source directory> <target directory>

Options
  --output-mode
  --homepage
  --ignore`,
      {
        flags: {
          outputMode: {
            type: "string",
            //choices: ["legacy", "fixed-legacy", "plain", "index-files"]
          },
          homepage: {
            type: "string",
          },
          ignore: {
            type: "string",
            isMultiple: true,
          },
        },
      },
    )

    if (buildCLI.input[1] && buildCLI.input[2]) {
      return build({
        source: buildCLI.input[1],
        target: buildCLI.input[2],
        ...buildCLI.flags,
      })
    }

    buildCLI.showHelp()
  case "serve":
  case "server":
    let serveCLI = meow(
      `
Usage
  ❯ charge serve <source directory>

Options
  --output-mode
  --ignore
  --port

Examples
  ❯ charge serve <source directory> --port 2468`,
      {
        flags: {
          outputMode: {
            type: "string",
            //choices: ["legacy", "fixed-legacy", "plain", "index-files"]
          },
          ignore: {
            type: "string",
            isMultiple: true,
          },
          port: {
            type: "number",
          },
        },
      },
    )

    if (serveCLI.input[1]) {
      return serve({
        source: serveCLI.input[1],
        ...serveCLI.flags,
      })
    }

    serveCLI.showHelp()
}
