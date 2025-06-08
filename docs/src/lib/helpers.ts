import { repository } from '../../package.json';

export const joinPathname = (pathname: string, parent: string) =>
  new URL(pathname, `https://whatever.com${parent}/`).pathname.replaceAll('//', '/');

const baseRepoUrl = new URL(repository.url.replace('git+http', 'http').replace(/\.git$/, '/'));

export const repoUrl = (pathname: `/${string}`) => new URL(`.${pathname}`, baseRepoUrl).toString();
