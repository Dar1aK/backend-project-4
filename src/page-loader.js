import axios from "axios";
import fsp from "fs/promises";
import path from "path";
import { load } from "cheerio";
import debug from "debug";
import Listr from "listr";

const log = debug("page-loader");

const fileName = (srcPath, pagePath) => {
  const origin = new URL(pagePath).origin;
  const src = srcPath.startsWith("/")
  ? `${origin}${srcPath}`
  : srcPath;
  const srcName = src.replace(/\W+/g, "-");
  return `${srcName}${path.parse(src).ext}`
}

const getSources = ($, dir, pagePath, filesDir) => {
  const images = $("img").map((_, { attribs }) => {
    const prevAttr = attribs.src
    $(`img[src="${attribs.src}"]`).attr('src', path.join(
      dir,
      filesDir,
      fileName(attribs.src, pagePath),
    ))
    return prevAttr
  });

  const links = $("link")
    .map((_, { attribs }) => {
      const prevAttr = attribs.href
      $(`link[href="${attribs.href}"]`).attr('href', path.join(
        dir,
        filesDir,
        fileName(attribs.href, pagePath),
      ))
      return attribs.href.endsWith(".css") ? prevAttr : null;
    })
    .filter((item) => item);

  const scripts = $("script").map((_, { attribs }) => {
    const prevAttr = attribs.src
    $(`script[src="${attribs.src}"]`).attr('src', path.join(
      dir,
      filesDir,
      fileName(attribs.src, pagePath),
    ))
    return prevAttr
  });

  return [...images, ...links, ...scripts]
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

  const file = pagePath.replace(/\W+/g, "-");
  const filesDir = `${file}_files`;
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
            fileName(src, pagePath),
          ))
        };
      })

      return tasks(listrTasks).run()
    })
    .then(() => fsp.writeFile(path.join(dir, `${file}.html`), $.html()))
    .then(() => `${dir}/${file}.html`);
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
      throw Error("load page error");
    });
};

export default pageLoader;
