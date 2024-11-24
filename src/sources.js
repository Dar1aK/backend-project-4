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

const sources = [{ tag: "img", attr: "src" }, { tag: "link", attr: "href" }, { tag: "script", attr: "src" }];

  const getSources = ($, dir, pagePath, filesDir) => {
    const origin = new URL(pagePath).origin;
    return sources.reduce((acc, {tag, attr}) => {
      const value = $(tag).filter((_, { attribs }) => attribs[attr] && (attribs[attr].startsWith("/") || attribs[attr].startsWith(pagePath)))
      .map((_, { attribs }) => {
        const newAttrib = attribs[attr].startsWith("/") ? `${origin}${attribs[attr]}` : attribs[attr]
        const srcPath = !path.parse(newAttrib).ext ? `${newAttrib}.html` : newAttrib
        $(`${tag}[${attr}="${attribs[attr]}"]`).attr(attr, path.join(
          dir,
          filesDir,
          getFileName(srcPath, pagePath),
        ))
        return newAttrib
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
      .then(() => getSources($, dir, pagePath, filesDir))
      .then((sources) => {
        const listrTasks = sources.map((src) => {
          const srcPath = !path.parse(src).ext ? `${src}.html` : src
          const outputPath = path.join(
            dir,
            filesDir,
            getFileName(srcPath, pagePath),
          )

          return {
            title: src,
            task: () => writeSource(src, outputPath)
          };
        })

        return tasks(listrTasks).run()
      })
      .then(() => $.html())
  };
