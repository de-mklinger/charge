import File from "./file"

export default class extends File {
  async build(_data) {
    let object = await super.build(_data)

    return Object.assign(object, { output: object.output.toString() })
  }
}
