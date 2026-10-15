export const isCourseEditorPath = (pathname = '') =>
  /^\/admin\/courses\/(?:new|[^/]+\/edit)\/?$/.test(pathname);
