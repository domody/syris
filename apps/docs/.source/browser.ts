// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"(root)/blocks.mdx": () => import("../content/docs/(root)/blocks.mdx?collection=docs"), "(root)/repo-structure.mdx": () => import("../content/docs/(root)/repo-structure.mdx?collection=docs"), }),
};
export default browserCollections;