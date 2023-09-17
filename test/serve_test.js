import test from "ava"
import request from "supertest"
import serve from "../lib/serve"
import { cleanFiles, createSourceFiles, sourceDirectory } from "./helpers/filesystem"

test.beforeEach((t) => cleanFiles())
test.after.always((t) => cleanFiles())

test("serves the root page", async (t) => {
  t.plan(3)

  await createSourceFiles({
    "index.html": "foo",
  })

  let browserSyncInstance = await serve({ source: sourceDirectory, openBrowser: false, port: 3000 })
  let server = browserSyncInstance.server

  let response = await request(server).get("/")

  t.is(response.status, 200)
  t.is(response.headers["content-type"], "text/html; charset=UTF-8")
  t.is(response.text, "foo")

  browserSyncInstance.publicInstance.exit()
})

test("serves a named page without the extension", async (t) => {
  t.plan(3)

  await createSourceFiles({
    "named.html": "foo",
  })

  let browserSyncInstance = await serve({ source: sourceDirectory, openBrowser: false, port: 3000 })
  let server = browserSyncInstance.server

  let response = await request(server).get("/named")

  t.is(response.status, 200)
  t.is(response.headers["content-type"], "text/html; charset=UTF-8")
  t.is(response.text, "foo")

  browserSyncInstance.publicInstance.exit()
})

test("serves a named page with the extension", async (t) => {
  t.plan(3)

  await createSourceFiles({
    "named.html": "foo",
  })

  let browserSyncInstance = await serve({ source: sourceDirectory, openBrowser: false, port: 3000 })
  let server = browserSyncInstance.server

  let response = await request(server).get("/named.html")

  t.is(response.status, 200)
  t.is(response.headers["content-type"], "text/html; charset=UTF-8")
  t.is(response.text, "foo")

  browserSyncInstance.publicInstance.exit()
})
