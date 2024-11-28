import path from 'path';

export const getFilePath = (pagePath) => pagePath.replace(/(https|http):\/\//g, '').replace(/\W+/g, '-');

export const getFilesDir = (pagePath) => `${getFilePath(pagePath)}_files`;

export const getFileName = (srcPath, origin) => {
  const src = new URL(srcPath, origin).href;
  const srcName = src
    .replace(/(https|http):\/\//g, '')
    .replace(/.[a-zA-Z]*$/, '')
    .replace(/\W+/g, '-');
  return `${srcName}${path.parse(src).ext}`;
};

export const pathTransformation = (origin, attrib) => {
  const newPath = attrib.startsWith('/')
    ? `${origin}${attrib}`
    : attrib;
  const srcPath = !path.parse(newPath).ext
    ? `${newPath}.html`
    : newPath;
  return { newPath, srcPath };
};
