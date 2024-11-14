import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path';
import { load } from 'cheerio';
import debug from 'debug'
import Listr from 'listr';

const log = debug('page-loader');

const tasks = new Listr([
	{
		title: 'Sources',
		task: (ctx) => {
            console.log(`source: ${ctx.src}`)
            return Promise.resolve(ctx.src)
        }
	},
]);

const loadSources = (pagePath, dir) => {
    return axios.get(pagePath)
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

            fsp.mkdir(path.join(dir, filesDir), { recursive: true })

            const resultFiles = [...images, ...links, ...scripts].map((srcPath) => {
                const src = srcPath.startsWith('/') ? `${origin}${srcPath}` : srcPath

                tasks.run({
                    src
                })

                const srcName = src.replace(/\W+/g, '-')
                const extension = src.split('.')
                newHtml = newHtml.replace(srcPath, path.join(dir, filesDir, `${srcName}.${extension[extension.length - 1]}`))

                axios.get(src, { responseType: 'binary' })
                    .then((img) => {
                        const imgData = img.data ?? img
                        return fsp.writeFile(path.join(dir, filesDir, `${srcName}.${extension[extension.length - 1]}`), imgData, "binary")
                    })
                    .catch((error) => {
                        log('loadSources write error', error)
                    })
                return newHtml
            })

            fsp.writeFile(path.join(dir, `${file}.html`), newHtml)
                .catch(() => {
                    throw Error('write html file error')
                })

            return `${dir}/${file}.html`
        })
        .catch((error) => {
            log('loadSources error', error)
            throw Error('read html file error')
        });
}

const pageLoader = async (pagePath, dir = process.cwd()) => {

    try {
        await fsp.access(dir, fsp.constants.W_OK)
    } catch {
        throw Error('Directory is not exist')
    }

    return loadSources(pagePath, dir)
}
export default pageLoader;