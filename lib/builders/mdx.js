import { addHook as overrideRequire } from "pirates"
import { sync as mdxTransform } from "@mdx-js/mdx"
import { transform as jsxTransform } from "./jsx"
import highlight from "remark-highlight.js"
import abbreviate from "remark-abbr"
import { closestFile, defaultMdxLayout, importComponent } from "../utilities"
import React from "react"
import ReactDOMServer from "react-dom/server"
import { dirname } from "path"

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

const applyDefaultLayout = async (element, modulePath, props) => {
  let layoutPath = dirname(modulePath)

  const defaultLayoutFile = closestFile(layoutPath, props.source, defaultMdxLayout)

  if (defaultLayoutFile) {
    const defaultLayoutComponent = await importComponent(defaultLayoutFile)
    element = React.createElement(defaultLayoutComponent.default, props, element)
    return element
  }

  return element
}

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
