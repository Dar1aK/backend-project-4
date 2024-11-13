import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path';
import { load } from 'cheerio';
import debug from 'debug'
import Listr from 'listr';

const log = debug('page-loader');

const tasksImg = new Listr([
	{
		title: 'Images',
		task: (ctx) => {
            console.log(`images: ${ctx.src}`)
            return Promise.resolve(ctx.src)
        }
	},
]);

const tasksScripts = new Listr([
	{
		title: 'Scripts',
		task: (ctx) => {
            console.log(`Scripts: ${ctx.src}`)
            return Promise.resolve(ctx.src)
        }
	},
]);

const fetchForImages = (fetch, imagesDir, dir, file, origin) => {
    return fetch
        .then(result => {
            const html = result.data ?? result
            let newHtml = html

            log('start', newHtml)

            const $ = load(html);
            const images = $('img').map((_, { attribs }) => attribs.src)
            images?.length ? images.map((_, srcPath) => {
                const src = srcPath.startsWith('/') ? `${origin}${srcPath}` : srcPath

                tasksImg.run({
                    src
                })

                const srcName = src.replace(/\W+/g, '-')
                const extension = src.split('.')
                newHtml = newHtml.replace(srcPath, path.join(dir, imagesDir, `${srcName}.${extension[extension.length - 1]}`))

                fsp.writeFile(path.join(dir, `${file}.html`), newHtml)
                    .catch(() => Promise.reject(new Error('write html file error')))

                fsp.mkdir(path.join(dir, imagesDir), { recursive: true })

                axios.get(src, { responseType: 'binary' })
                    .then((img) => {
                        const imgData = img.data ?? img
                        return fsp.writeFile(path.join(dir, imagesDir, `${srcName}.${extension[extension.length - 1]}`), imgData, "binary")
                    })
                    .catch((error) => {
                        log('fetchForImages write error', error)
                    })
                return newHtml
            }) : fsp.writeFile(path.join(dir, `${file}.html`), newHtml)
            return newHtml
        })
        .catch((error) => {
            log('fetchForImages error', error)
            return Promise.reject(new Error('read html file error'))
        });
}

const fetchForScripts = (html, filesDir, dir, file, origin) => {
    if (!html) {
        log('fetchForScripts error')
        return Promise.reject(new Error('fetchForScripts error'))
    }
    let newHtml = html

    log('start scripts', newHtml)

    const $ = load(html);
    const links = $('link').map((_, { attribs }) => {
        return attribs.href.endsWith('.css') ? attribs.href : null
    }).filter(item => item)
    const scripts = $('script').map((_, { attribs }) => attribs.src)
    const requests = [...links, ...scripts].forEach((srcPath) => {

        const src = srcPath.startsWith('/') ? `${origin}${srcPath}` : srcPath

        tasksScripts.run({
            src
        })

        const srcName = src.replace(/\W+/g, '-')
        const extension = src.split('.')

        newHtml = newHtml.replace(srcPath, path.join(dir, filesDir, `${srcName}.${extension[extension.length - 1]}`))

        fsp.mkdir(path.join(dir, filesDir), { recursive: true })

        axios.get(src, { responseType: 'binary' })
            .then(async (file) => {
                const fileData = file.data ?? file
                return await fsp.writeFile(path.join(dir, filesDir, `${srcName}.${extension[extension.length - 1]}`), fileData, "binary")
            })
            .catch((error) => {
                debug('fetchForScripts error', error)
            });

            fsp.writeFile(path.join(dir, `${file}.html`), newHtml)

    })
    return `${dir}/${file}.html`
}

const pageLoader = async (pagePath, dir = process.cwd()) => {
    const fetch = axios.get(pagePath)
    const file = pagePath.replace(/\W+/g, '-')
    const filesDir = `${file}_files`
    const origin = (new URL(pagePath)).origin

    try {
        await fsp.access(dir, fsp.constants.W_OK)
    } catch {
        return Promise.reject(new Error('Directory is not exist'))
    }

    const newHtml = await fetchForImages(fetch, filesDir, dir, file, origin)

    const htmlPath = await fetchForScripts(newHtml, filesDir, dir, file, origin)

    return htmlPath;
}
export default pageLoader;