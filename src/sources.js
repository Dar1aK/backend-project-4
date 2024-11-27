import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path'
import Listr from 'listr'
import debug from 'debug'

import { getFilesDir, getFileName } from './names.js'

const log = debug('page-loader')

const sources = [
    { tag: 'img', attr: 'src' },
    { tag: 'link', attr: 'href' },
    { tag: 'script', attr: 'src' },
]

const getSources = ($, dir, pagePath, filesDir) => {
    const origin = new URL(pagePath).origin
    return sources.reduce((acc, { tag, attr }) => {
        const value = $(tag)
            .filter(
                (_, { attribs }) =>
                    attribs[attr] &&
                    (attribs[attr].startsWith('/') ||
                        attribs[attr].startsWith(origin))
            )
            .map((_, { attribs }) => {
                const newAttrib = attribs[attr].startsWith('/')
                    ? `${origin}${attribs[attr]}`
                    : attribs[attr]
                const srcPath = !path.parse(newAttrib).ext
                    ? `${newAttrib}.html`
                    : newAttrib
                const outputPath = path.join(
                    dir,
                    filesDir,
                    getFileName(srcPath, pagePath)
                )
                $(`${tag}[${attr}="${attribs[attr]}"]`).attr(attr, outputPath)
                return newAttrib
            })
        return [...acc, ...value]
    }, [])
}

const writeSource = (src, outputPath) => {
    return axios
        .get(src, { responseType: 'arraybuffer' })
        .then((source) => fsp.writeFile(outputPath, source.data, 'binary'))
        .catch((error) => {
            log('loadSources error', error)
        })
}

export const getAndSaveSources = (pagePath, dir, outputPage) => {
    const filesDir = getFilesDir(pagePath)
    const tasks = (listrTasks) => new Listr(listrTasks)

    return Promise.resolve()
        .then(() => getSources(outputPage, dir, pagePath, filesDir))
        .then((sources) => {
            const listrTasks = sources.map((src) => {
                const srcPath = !path.parse(src).ext ? `${src}.html` : src
                const outputPath = path.join(
                    dir,
                    filesDir,
                    getFileName(srcPath, pagePath)
                )

                return {
                    title: src,
                    task: () => writeSource(src, outputPath),
                }
            })

            return tasks(listrTasks).run()
        })
}
