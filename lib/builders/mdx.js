import { addHook as overrideRequire } from "pirates"
import { sync as mdxTransform } from "@mdx-js/mdx"
import jsxBuilder, { transform as jsxTransform } from "./jsx"
import highlight from "remark-highlight.js"
import abbreviate from "remark-abbr"
import { importComponent } from "../utilities"
import React from "react"
import ReactDOMServer from "react-dom/server"
import { dirname, join, resolve } from "path"
import { existsSync } from "fs"

const transform = (code) => {
  let jsxWithMDXTags = mdxTransform(code, {
    remarkPlugins: [abbreviate, highlight],
  })

  let jsx = `
    import { mdx } from "@mdx-js/react"

    ${jsxWithMDXTags}
  `

  return jsxTransform(jsx)
}

overrideRequire(transform, { exts: [".mdx"] })

export default async (modulePath, props) => {
  let component = await importComponent(modulePath)
  let element = React.createElement(component.default)

  if (component.layout) {
    element = React.createElement(component.layout, props, element)
  } else if (component.layout !== null) {
    element = await applyDefaultLayout(element, modulePath, props)
  }

  let html = ReactDOMServer.renderToStaticMarkup(element)

  return {
    meta: component.meta || {},
    output: html,
  }
}

async function applyDefaultLayout(element, modulePath, props) {
  let layoutPath = dirname(modulePath)

  do {
    const defaultLayoutFile = join(layoutPath, "default-mdx-layout.jsx")
    if (existsSync(defaultLayoutFile)) {
      const defaultLayoutComponent = await importComponent(defaultLayoutFile)
      element = React.createElement(defaultLayoutComponent.default, props, element)
      return element
    }
    layoutPath = dirname(layoutPath)
  } while (isSourcePath(props.source, layoutPath))

  return element
}

function isSourcePath(source, path) {
  const absoluteSource = resolve(source)
  const absolutePath = resolve(path)
  return absolutePath.startsWith(absoluteSource + "/") || absolutePath === absoluteSource
}
