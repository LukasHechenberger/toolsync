import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

// See https://fumadocs.vercel.app/docs/headless/source-api for more info
export const source = loader({
  // it assigns a URL to your pages
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  pageTree: {
    attachFile(node, file) {
      if (file?.data?.data?.tocTitle) {
        node.name = file.data.data.tocTitle;
      }

      return node;
    },
  },
});
