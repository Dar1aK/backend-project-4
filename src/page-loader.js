import axios from "axios";
import fsp from "fs/promises";
import path from "path";
import { load } from "cheerio";
import debug from "debug";
import Listr from "listr";

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
      prevAttr && $(`${tag}[${attr}="${prevAttr}"]`).attr(attr, path.join(
        dir,
        filesDir,
        getFileName(prevAttr, pagePath),
      ))
      return prevAttr
    })
    return [...acc, ...value]
  }, [])

};

const writeSource = (src, outputPath) => {
  return axios.get(src, { responseType: "binary" })
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

const getAndSaveSources = (html, pagePath, dir) => {
  const tasks = (listrTasks) => new Listr(listrTasks);

  const filePath = pagePath.replace(/(https|http):\/\//g, '').replace(/\W+/g, "-");
  const htmlFileName = `${filePath}.html`
  const filesDir = `${filePath}_files`;
  const $ = load(html)

  return fsp
    .mkdir(path.join(dir, filesDir), { recursive: true })
    .then(() => {
      const origin = new URL(pagePath).origin;
      const listrTasks = getSources($, dir, pagePath, filesDir).map((pathSrc) => {
        const src = pathSrc.startsWith("/")
          ? `${origin}${pathSrc}`
          : pathSrc;

        return {
          title: src,
          task: () => writeSource(src, path.join(
            dir,
            filesDir,
            getFileName(src, pagePath),
          ))
        };
      })

      return tasks(listrTasks).run()
    })
    .then(() => fsp.writeFile(path.join(dir, htmlFileName), $.html()))
    .then(() => `${dir}/${htmlFileName}`);
};

const pageLoader = async (pagePath, dir = process.cwd()) => {

  return fsp
    .access(dir)
    .then(() => axios.get(pagePath))
    .then((result) => {
      const html = result.data;

      log("start", html);

      return getAndSaveSources(html, pagePath, dir);
    })
    .catch((error) => {
      log("load page error", error);
      throw Error(error);
    });
};

export default pageLoader;
