export const joinPathname = (pathname: string, parent: string) =>
  new URL(pathname, `https://whatever.com${parent}/`).pathname.replaceAll('//', '/');
