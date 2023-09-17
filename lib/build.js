import { buildGlobIgnore, defaultMdxLayout, globSync, globSyncNormalize } from "./utilities"
import {
  parse as pathParse,
  resolve as pathResolve,
  join as pathJoin,
  basename as pathBasename,
  sep as pathSeparator,
} from "path"
import { emptyDirSync, readFileSync, outputFileSync } from "fs-extra"
import flatMap from "lodash.flatmap"
import uniqBy from "lodash.uniqby"
import logger from "./logger"
import File from "./file"
import React from "react"
import { importComponent } from "./utilities"

// These need to be required here. The modules aren’t used here but requiring them
// registers their types on the File module so the proper class can be found.
globSync(`${__dirname}/files/*`).forEach((module) => require(module))

let loadData = (source) => {
  let dataDirectory = pathResolve(`${source}/../data`)
  let dataFiles = globSyncNormalize(`${dataDirectory}/*.json`)

  return dataFiles.reduce((data, file) => {
    let fileName = pathParse(file).name
    data[fileName] = JSON.parse(readFileSync(file))
    return data
  }, {})
}

let dependentsOfDependency = (sourceFiles, file) => {
  let sourceFilesThatImportFile = sourceFiles.filter((sourceFile) => {
    try {
      return sourceFile.importedDependencyPaths.includes(file.path)
    } catch (_error) {
      return false
    }
  })

  if (sourceFilesThatImportFile.length) {
    let files = flatMap(sourceFilesThatImportFile, (sourceFileThatImportFile) => {
      return dependentsOfDependency(sourceFiles, sourceFileThatImportFile)
    })

    return uniqBy(files, "path")
  } else {
    return [file]
  }
}

let dependentsThatAreNotDependencies = (sourceFiles) => {
  let importedDependencyPaths = flatMap(sourceFiles, (sourceFile) => {
    try {
      return sourceFile.importedDependencyPaths
    } catch (_error) {
      return []
    }
  })

  return sourceFiles.filter((sourceFile) => {
    return !importedDependencyPaths.includes(sourceFile.path)
  })
}

const buildPath = (outputPath, outputMode) => {
  outputPath = outputPath.replace(/\\/g, "/")

  switch (outputMode) {
    case "plain":
      return outputPath.endsWith("/index.html")
        ? outputPath.replace(/index\.html$/, "")
        : outputPath
    case "index-files":
      return outputPath.endsWith("/index.html")
        ? outputPath.replace(/index\.html$/, "")
        : outputPath.replace(/\.html$/, "/")
    case "fixed-legacy":
      return outputPath.endsWith("/index.html")
        ? outputPath.replace(/index\.html$/, "")
        : outputPath.replace(/\.html$/, "")
    default:
      return outputPath === "/index.html" ? "/" : outputPath.replace(/\.html$/, "")
  }
}

const buildRelativeOutputPath = (outputPath, outputMode) => {
  if (
    outputMode === "index-files" &&
    outputPath.endsWith(".html") &&
    !outputPath.endsWith(`${pathSeparator}index.html`)
  ) {
    return outputPath.replace(/\.html$/, `${pathSeparator}index.html`)
  }
  return outputPath
}

const buildAbsoluteOutputPath = (target, outputPath, outputMode) => {
  return pathJoin(target, buildRelativeOutputPath(outputPath, outputMode))
}

export default async ({
  source,
  target,
  file,
  ignore,
  outputMode,
  homepage = "",
  environment = "production",
}) => {
  let files = globSyncNormalize(`${source}/**/*`, {
    nodir: true,
    ignore: buildGlobIgnore(source, ignore),
  })

  let sourceFiles = files.map((file) => {
    return File.instantiateByType({
      path: file,
      relativePath: file.replace(source, ""),
    })
  })

  sourceFiles.forEach((sourceFile) => {
    delete require.cache[sourceFile.path]
  })

  let sourceFilesThatCouldBeBuilt = dependentsThatAreNotDependencies(sourceFiles).filter(
    (file) => pathBasename(file.path) !== defaultMdxLayout,
  )

  if (file) {
    file = File.instantiateByType({
      path: file,
      relativePath: file.replace(source, ""),
    })

    var sourceFilesToBuild = dependentsOfDependency(sourceFiles, file)
  } else {
    var sourceFilesToBuild = sourceFilesThatCouldBeBuilt

    emptyDirSync(target)
  }

  let data = loadData(source)
  let componentSourceFiles = sourceFilesThatCouldBeBuilt.filter(
    (sourceFile) => sourceFile.isComponent,
  )

  let pages = await Promise.all(
    componentSourceFiles.map(async (sourceFile) => {
      let component = await importComponent(sourceFile.path)
      let outputPath = sourceFile.outputPath

      const path = buildPath(outputPath, outputMode)

      return {
        component: component.default,
        meta: component.meta || {},
        path,
        url: homepage + path,
        sourceFile: {
          absolutePath: sourceFile.path,
          relativePath: sourceFile.relativePath,
        },
        targetFile: {
          absolutePath: buildAbsoluteOutputPath(target, outputPath, outputMode),
          relativePath: buildRelativeOutputPath(outputPath, outputMode),
        },
      }
    }),
  )

  for (const sourceFile of sourceFilesToBuild) {
    logger.builder.building(sourceFile.outputPath)

    try {
      const currentPage = pages.find((p) => p.sourceFile.relativePath === sourceFile.relativePath)

      if (sourceFile.isComponent && !currentPage) {
        throw new Error(`Page not found for component ${sourceFile.relativePath}`)
      }

      let built = await sourceFile.build({
        source,
        target,
        data: data,
        environment: environment,
        pages: pages,
        currentPage,
      })

      const output = built.output

      const absoluteOutputPath = buildAbsoluteOutputPath(target, sourceFile.outputPath, outputMode)

      outputFileSync(absoluteOutputPath, output)
    } catch (error) {
      error.stack = `${sourceFile.outputPath}\n${error.stack}`
      logger.builder.building(error)
      throw error
    }
  }

  return sourceFilesToBuild.map((sourceFile) =>
    buildRelativeOutputPath(sourceFile.outputPath, outputMode),
  )
}
