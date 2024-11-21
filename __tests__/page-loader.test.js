import fsp from "fs/promises";
import os from "os";
import path from "path";
import nock from "nock";

import pageLoader from "../src/page-loader";

describe("pageLoader", () => {
  let folder;
  beforeEach(async () => {
    await fsp.mkdtemp(
      path.join(os.tmpdir(), "page-loader-"),
      (err, tempFolder) => {
        if (err) console.log(err);
        else {
          console.log("The temporary folder path is:", tempFolder);
          folder = tempFolder;
        }
      },
    );

    nock("https://ru.hexlet.io")
      .persist()
      .get("/courses")
      .reply(
        200,
        async () =>
          await fsp.readFile(
            path.resolve(__dirname, "../__fixtures__/courses/index.html"),
            { encoding: "utf8" },
          ),
      )
      .get("/courses/assets/nodejs.png")
      .reply(
        200,
        async () =>
          await fsp.readFile(
            path.resolve(
              __dirname,
              "../__fixtures__/courses/assets/nodejs.png",
            ),
            { encoding: "binary" },
          ),
      )
      .get("/photos/react.png")
      .reply(
        200,
        async () =>
          await fsp.readFile(
            path.resolve(__dirname, "../__fixtures__/photos/react.png"),
            { encoding: "binary" },
          ),
      )
      .get("/courses/assets/application.css")
      .reply(
        200,
        async () =>
          await fsp.readFile(
            path.resolve(
              __dirname,
              "../__fixtures__/courses/assets/application.css",
            ),
            { encoding: "binary" },
          ),
      )
      .get("/assets/menu.css")
      .reply(
        200,
        async () =>
          await fsp.readFile(
            path.resolve(__dirname, "../__fixtures__/courses/assets/menu.css"),
            { encoding: "binary" },
          ),
      )
      .get("/courses/assets/scripts.js")
      .reply(
        200,
        async () =>
          await fsp.readFile(
            path.resolve(
              __dirname,
              "../__fixtures__/courses/assets/scripts.js",
            ),
            { encoding: "binary" },
          ),
      )
      .get("/11111")
      .reply(
        200,
        async () =>
          await fsp.readFile(path.resolve(__dirname, "../__fixtures__/11111")),
      )
      .get("/courses/assets/not-exist.css")
      .reply(404);
  });

  test("run pageLoader", async () => {
    const htmlPath = await pageLoader("https://ru.hexlet.io/courses");

    const fileResult = await fsp.readFile(path.resolve(htmlPath), {
      encoding: "utf8",
    });
    const fixture = await fsp.readFile(
      path.resolve(__dirname, "../__fixtures__/result/index.html"),
      { encoding: "utf8" },
    );

    expect(JSON.stringify(fileResult).replace(/\s+/g, '')).toBe(JSON.stringify(fixture).replace(/\s+/g, ''));
  });

  test("check pageLoader with sources", async () => {
    const htmlPath = await pageLoader("https://ru.hexlet.io/courses");

    const fileResult = await fsp.readFile(path.resolve(htmlPath), {
      encoding: "utf8",
    });

    const img1 =
      "/home/runner/work/backend-project-4/backend-project-4/ru-hexlet-io-courses_files/ru-hexlet-io-courses-assets-nodejs-png.png";
    const img2 =
      "/home/runner/work/backend-project-4/backend-project-4/ru-hexlet-io-courses_files/ru-hexlet-io-photos-react-png.png";
    const css =
      "/home/runner/work/backend-project-4/backend-project-4/ru-hexlet-io-courses_files/ru-hexlet-io-courses-assets-application-css.css";
    const js =
      "/home/runner/work/backend-project-4/backend-project-4/ru-hexlet-io-courses_files/ru-hexlet-io-courses-assets-scripts-js.js";

    expect(fileResult.indexOf(img1)).toBeGreaterThanOrEqual(0);
    expect(fileResult.indexOf(img2)).toBeGreaterThanOrEqual(0);
    expect(fileResult.indexOf(css)).toBeGreaterThanOrEqual(0);
    expect(fileResult.indexOf(js)).toBeGreaterThanOrEqual(0);
  });

  test("check pageLoader with error link", async () => {
    expect(
      async () => await pageLoader("https://ru.hexlet.io/11111"),
    ).rejects.toThrow();
  });

  test("run pageLoader with not existing directory", async () => {
    expect(
      async () =>
        await pageLoader("https://ru.hexlet.io/courses", "/not-exist"),
    ).rejects.toThrow();
  });
});
