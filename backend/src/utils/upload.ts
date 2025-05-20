import * as path from 'path';
import fs from 'fs/promises';


const folderPublic = path.resolve(__dirname, '../../public');
export async function uploadFile(pathDestination: string, file: Express.Multer.File) {
  await fs.rename(file.path, path.join(folderPublic, pathDestination));
  return;
}

export function getPath(pathElement: string) {
  return path.join(folderPublic, pathElement);
}

/**
 * 
 * @param pathFile relative path file public folder
 */
export function getLinkFile(pathFile: string) {
  return `${process.env.APP_URL}/${pathFile}`;
}

export function siteUrl(url: string) {
  return process.env.APP_URL + url;
}

export async function deleteFile(pathFile: string) {
  console.log(path.join(folderPublic, pathFile));
  await fs.unlink(path.join(folderPublic, pathFile));
}