import axios from "axios";
import fsp from "fs/promises";
import path from "path";
import { load } from "cheerio";
import Listr from "listr";
import debug from "debug";

const log = debug("page-loader");


const getFileName = (srcPath, pagePath) => {
    const origin = new URL(pagePath).origin;
    const src = srcPath.startsWith("/")
    ? `${origin}${srcPath}`
    : srcPath;
    const srcName = src.replace(/(https|http):\/\//g, '').replace(/.[a-zA-Z]*$/, '').replace(/\W+/g, "-");
    return `${srcName}${path.parse(src).ext}`
  }

  const getSources = ($, dir, pagePath, filesDir) => {
    const sources = [{ tag: "img", attr: "src" }, { tag: "link", attr: "href" }, { tag: "script", attr: "src" }];

    return sources.reduce((acc, {tag, attr}) => {
      const value = $(tag).map((_, { attribs }) => {
        const prevAttr = attribs[attr]
        const srcPath = !path.parse(prevAttr).ext ? `${prevAttr}.html` : prevAttr
        prevAttr && $(`${tag}[${attr}="${prevAttr}"]`).attr(attr, path.join(
          dir,
          filesDir,
          getFileName(srcPath, pagePath),
        ))
        return prevAttr
      })
      return [...acc, ...value]
    }, [])
  };

  const writeSource = (src, outputPath) => {
    return axios.get(src, { responseType: "arraybuffer" })
    .then((source) =>
      fsp.writeFile(
        outputPath,
        source.data,
        "binary",
      )
    )
    .catch((error) => {
      log("loadSources error", error)
    });
  };

  export const getAndSaveSources = (html, pagePath, dir, filesDir) => {
    const tasks = (listrTasks) => new Listr(listrTasks);

    const $ = load(html)

    return Promise.resolve()
      .then(() => {
        const origin = new URL(pagePath).origin;
        const listrTasks = getSources($, dir, pagePath, filesDir).map((pathSrc) => {
          const src = pathSrc.startsWith("/")
            ? `${origin}${pathSrc}`
            : pathSrc;
          const srcPath = !path.parse(src).ext ? `${src}.html` : src

          return {
            title: src,
            task: () => writeSource(src, path.join(
              dir,
              filesDir,
              getFileName(srcPath, pagePath),
            ))
          };
        })

        return tasks(listrTasks).run()
      })
      .then(() => $.html())
  };
