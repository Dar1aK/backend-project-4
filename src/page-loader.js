import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path';
import { load } from 'cheerio';
import debug from 'debug'
import Listr from 'listr';

const log = debug('page-loader');

const loadSources = (pagePath, dir) => {
    const tasks = new Listr([
        {
            title: 'Sources',
            task: (ctx) => {
                console.log(`source: ${ctx.src}`)
                return ctx.src
            }
        },
    ]);

    const writeSource = (src, srcName, extension, filesDir) => {
        return axios.get(src, { responseType: 'binary' })
        .then((source) => {
            return fsp.writeFile(path.join(dir, filesDir, `${srcName}.${extension[extension.length - 1]}`), source.data, "binary")
        })
    }

    return fsp.access(dir)
        .then(() => axios.get(pagePath))
        .then(result => {
            const html = result.data ?? result
            let newHtml = html

            log('start', newHtml)

            const file = pagePath.replace(/\W+/g, '-')
            const filesDir = `${file}_files`
            const origin = (new URL(pagePath)).origin

            const $ = load(html);
            const images = $('img').map((_, { attribs }) => attribs.src)
            const links = $('link').map((_, { attribs }) => {
                return attribs.href.endsWith('.css') ? attribs.href : null
            }).filter(item => item)
            const scripts = $('script').map((_, { attribs }) => attribs.src)

            return Promise.resolve()
                .then(() => fsp.mkdir(path.join(dir, filesDir), { recursive: true }))
                .then(() => [...images, ...links, ...scripts].forEach((srcPath) => {
                    const src = srcPath.startsWith('/') ? `${origin}${srcPath}` : srcPath

                    tasks.run({
                        src
                    })

                    const srcName = src.replace(/\W+/g, '-')
                    const extension = src.split('.')
                    newHtml = newHtml.replace(srcPath, path.join(dir, filesDir, `${srcName}.${extension[extension.length - 1]}`))

                    writeSource(src, srcName, extension, filesDir)
                }))
                .then(() => fsp.writeFile(path.join(dir, `${file}.html`), newHtml))
                .then(() => `${dir}/${file}.html`)
        })
        .catch((error) => {
            log('loadSources error', error)
            throw Error('loadSources error')
        });
}

const pageLoader = async (pagePath, dir = process.cwd()) => {
    return loadSources(pagePath, dir)
}

export default pageLoader;