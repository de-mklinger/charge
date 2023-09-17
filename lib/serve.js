import { parse as parseURL } from "url"
import { resolve as pathResolve, join as pathJoin } from "path"
import { existsSync, readFileSync } from "fs"
import BrowserSync from "browser-sync"
import logger from "./logger"
import build from "./build"

const fileIsData = (path) => {
  return path.startsWith("data/")
}

const fileIsAddedOrRemoved = (event) => {
  return ["add", "unlink", "addDir", "unlinkDir"].includes(event)
}

const fileIsChanged = (event) => {
  return event === "change"
}

export default async ({
  source,
  openBrowser = true,
  outputMode,
  defaultMdxLayout,
  port = 2468,
}) => {
  let target = pathResolve("tmp/target")

  const buildProps = {
    source,
    target,
    outputMode,
    defaultMdxLayout,
    environment: "development",
  }

  logger.builder.start(`Building static files from ${source}`)

  await build(buildProps)

  logger.builder.done(`Static files built!`)

  let tryDirectoryIndex = (request, response, next) => {
    let url = parseURL(request.url)
    let path = url.path

    let filePath = pathJoin(target, path, `index.html`)
    if (!existsSync(filePath)) {
      filePath = pathJoin(target, `${path}.html`)
    }
    if (!existsSync(filePath)) {
      next()
    } else {
      response.statusCode = 200
      response.setHeader("Content-Type", "text/html; charset=UTF-8")
      response.end(readFileSync(filePath).toString())
    }
  }

  let notFound = (request, response) => {
    let url = parseURL(request.url)
    let path = url.path
    let filePath = pathJoin(target, path)

    response.statusCode = 404
    response.setHeader("Content-Type", "text/plain")
    response.end(`File ${filePath} not found!`)
  }

  let browserSync = BrowserSync.create()

  logger.watcher.start(source)

  let sourceGlob = `${source}/**/*`
  let dataGlob = `data/*.json`

  browserSync.watch([sourceGlob, dataGlob], { ignoreInitial: true }, async (event, file) => {
    if (fileIsAddedOrRemoved(event) || fileIsData(file)) {
      await build(buildProps)

      logger.browser.reload()

      browserSync.reload()
    } else if (fileIsChanged(event)) {
      let filePaths = await build({
        ...buildProps,
        file,
      })

      logger.browser.reload()

      browserSync.reload(filePaths)
    }
  })

  const middleware =
    outputMode === "plain" || outputMode === "index-files" ? [] : [tryDirectoryIndex]

  return new Promise((resolve) => {
    browserSync.init(
      {
        logLevel: "silent",
        middleware: middleware,
        open: openBrowser,
        port: port,
        server: {
          baseDir: target,
        },
      },
      (error, browserSyncInstance) => {
        let actualPort = browserSyncInstance.options.get("port")
        browserSyncInstance.addMiddleware("*", notFound)

        logger.server.start(`Running on port ${actualPort}`)
        logger.browser.open(`Opening http://localhost:${actualPort}`)

        resolve(browserSyncInstance)
      },
    )
  })
}
