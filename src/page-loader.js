import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path';
import cheerio from 'cheerio';

export const fetchForImages = (fetch, imagesDir, dir, file, pagePath, isLoadingFromTheInternet) => {
    return fetch
        .then(result => {
            const html = result.data ?? result
            let newHtml = html

            const $ = cheerio.load(html);
            const images = $('img').map((_, { attribs }) => attribs.src)
            images?.length ? images.map((_, src) => {

                const url = isLoadingFromTheInternet ? src.startsWith(new URL(pagePath).origin) : (src.startsWith(new URL(pagePath).origin) || src.startsWith('/'))
                if (!url) {
                    fsp.writeFile(path.join(dir, `${file}.html`), newHtml)
                    return null
                }
                const srcName = src.replace(/\W+/g, '-')
                const extension = src.split('.')
                newHtml = newHtml.replace(src, path.join(dir, imagesDir, `${srcName}.${extension[extension.length - 1]}`))

                fsp.writeFile(path.join(dir, `${file}.html`), newHtml)

                return fsp.mkdir(path.join(dir, imagesDir), { recursive: true })
                    .then(() => isLoadingFromTheInternet ? axios.get(src, { responseType: 'binary' }) : fsp.readFile(path.join(dir, src)))
                    .then((img) => {
                        const imgData = img.data ?? img
                        return fsp.writeFile(path.join(dir, imagesDir, `${srcName}.${extension[extension.length - 1]}`), imgData, "binary")
                    })
                    .catch(console.log)
            }) : fsp.writeFile(path.join(dir, `${file}.html`), newHtml)
            return newHtml
        })
        .catch((error) => {
            // console.log('error', error);
        });
}

export const fetchForScripts = (html, filesDir, dir, paths, linksPath) => {
    let newHtml = html
    const $ = cheerio.load(html);
    const links = $('link').map((_, { attribs }) => {
        return attribs.href.endsWith('.css') ? attribs.href : null
    }).filter(item => item)
    const scripts = $('script').map((_, { attribs }) => attribs.src)
    const requests = [...links, ...scripts].forEach((src) => {

        const url = linksPath ? src.startsWith(new URL(linksPath).origin) || src.startsWith('/') : src.startsWith(new URL(paths).origin)
        if (!url) {
            return null
        }
        const srcName = src.replace(/\W+/g, '-')
        const extension = src.split('.')

        newHtml = newHtml.replace(src, path.join(dir, filesDir, `${srcName}.${extension[extension.length - 1]}`))

        fsp.mkdir(path.join(dir, filesDir), { recursive: true })
            .then(async () =>  src.startsWith('http') ? await axios.get(src, { responseType: 'binary' }) : await fsp.readFile(path.join(dir, src)))
            .then(async (file) => {
                const fileData = file.data ?? file
                return await fsp.writeFile(path.join(dir, filesDir, `${srcName}.${extension[extension.length - 1]}`), fileData, "binary")
            })
            .catch((error) => {
                // console.log('error', error);
            });
    })
    return newHtml
}

const pageLoader = async (pagePath, dir = process.cwd()) => {
    const fetch = axios.get(pagePath)
    const file = pagePath.replace(/\W+/g, '-')
    const filesDir = `${file}_files`
    let newHtml = await fetchForImages(fetch, filesDir, dir, file, pagePath, true)

    newHtml = await fetchForScripts(newHtml, filesDir, dir, pagePath)

    return newHtml;
}
export default pageLoader;