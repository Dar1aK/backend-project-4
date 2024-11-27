import path from 'path';

export const getFilePath = (pagePath) => pagePath.replace(/(https|http):\/\//g, '').replace(/\W+/g, '-');

export const getFilesDir = (pagePath) => `${getFilePath(pagePath)}_files`;

export const getFileName = (srcPath, pagePath) => {
  const { origin } = new URL(pagePath);
  const src = srcPath.startsWith('/') ? `${origin}${srcPath}` : srcPath;
  const srcName = src
    .replace(/(https|http):\/\//g, '')
    .replace(/.[a-zA-Z]*$/, '')
    .replace(/\W+/g, '-');
  return `${srcName}${path.parse(src).ext}`;
};

export const pathTransformation = (origin, attrib) => {
  const newAttrib = attrib.startsWith('/')
    ? `${origin}${attrib}`
    : attrib;
  const srcPath = !path.parse(newAttrib).ext
    ? `${newAttrib}.html`
    : newAttrib;
  return { newAttrib, srcPath };
};
