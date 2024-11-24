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
    return sources.reduce((acc, {tag, attr}) => {
      const value = $(tag).filter((_, { attribs }) => attribs[attr] && attribs[attr].startsWith("/"))
      .map((_, { attribs }) => {
        const attrib = attribs[attr]
        const srcPath = !path.parse(attrib).ext ? `${attrib}.html` : attrib
        $(`${tag}[${attr}="${attrib}"]`).attr(attr, path.join(
          dir,
          filesDir,
          getFileName(srcPath, pagePath),
        ))
        return attrib
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
        const origin = new URL(pagePath).origin;
        const listrTasks = sources.map((pathSrc) => {
          const src = `${origin}${pathSrc}`;
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
