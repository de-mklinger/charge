import glob from "glob"
import { dirname, join, normalize, resolve, sep as separator } from "path"
import { existsSync } from "fs"

export const importComponent = async (path) => {
  try {
    var component = await import(path)
  } catch (error) {
    const relativePath = path.replace(`${process.cwd()}${separator}`, "")
    const file = `\nFile: ${relativePath}`

    let description = error.toString()
    let codeFrame = error.codeFrame

    error.stack = [file, description, codeFrame].join("\n")

    throw error
  }

  return component
}

export const globSync = (pattern, options = {}) => {
  return glob.sync(pattern, options)
}

export const globSyncNormalize = (pattern, options = {}) => {
  return globSync(pattern, options).map((path) => normalize(path))
}

export const closestFile = (startDir, rootDir, filename) => {
  rootDir = resolve(rootDir)
  startDir = resolve(startDir)

  if (!isRootDirPath(rootDir, startDir)) {
    throw new Error()
  }

  let currentDir = startDir

  while (isRootDirPath(rootDir, currentDir)) {
    const file = join(currentDir, filename)
    if (existsSync(file)) {
      return file
    }

    const newCurrentDir = dirname(currentDir)
    if (newCurrentDir === currentDir) {
      break
    }
    currentDir = newCurrentDir
  }
}

function isRootDirPath(rootDir, path) {
  return path === rootDir || path.startsWith(`${rootDir}/`)
}
