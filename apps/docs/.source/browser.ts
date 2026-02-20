// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"blocks.mdx": () => import("../content/docs/blocks.mdx?collection=docs"), "repo-structure.mdx": () => import("../content/docs/repo-structure.mdx?collection=docs"), }),
};
export default browserCollections;