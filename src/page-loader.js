import axios from 'axios'
import fsp from 'fs/promises'
import path from 'path';

const pageLoader = (pagePath, dir = process.cwd()) => {
    console.log(pagePath, dir)
    const file = pagePath.replace(/\W+/g, '-')
    return axios.get(pagePath)
        .then(result => {
            fsp.writeFile(path.join(dir, `${file}.html`), result.data)
            return result.data
        })
        .catch((error) => {
            console.log('error', error);
        });
}
export default pageLoader;