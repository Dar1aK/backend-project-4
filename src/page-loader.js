import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path';
import cheerio from 'cheerio';

const pageLoader = (pagePath, dir = process.cwd()) => {
    const isLoadingFromTheInternet = pagePath.startsWith('http')
    const fetch = isLoadingFromTheInternet ? axios.get(pagePath) : fsp.readFile(pagePath, { encoding: 'utf8' })
    const file = pagePath.replace(/\W+/g, '-')
    const imagesDir = `${file}_files`
    return fetch
        .then(result => {
            const html = result.data ?? result
            let newHtml = html

            const $ = cheerio.load(html);
            const images = $('img').map((_, {attribs}) => attribs.src)
            const requests = images.map((_, src) => {
                const srcName = src.replace(/\W+/g, '-')
                const extension = src.split('.')
                newHtml = newHtml.replace(src, path.join(dir, imagesDir, `${srcName}.${extension[extension.length - 1]}`))

                fsp.writeFile(path.join(dir, `${file}.html`), newHtml)

                return fsp.mkdir(path.join(dir, imagesDir), { recursive: true })
                    .then(() => isLoadingFromTheInternet ? axios.get(src, {responseType: 'binary'}) : fsp.readFile(path.join(dir, src)))
                    .then((img) => {
                        const imgData = img.data ?? img
                        return fsp.writeFile(path.join(dir, imagesDir, `${srcName}.${extension[extension.length - 1]}`), imgData, "binary")
                    })
                    .catch(console.log)
            })
            return newHtml
        })
        .catch((error) => {
            console.log('error', error);
        });
}
export default pageLoader;