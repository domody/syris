// @ts-nocheck
import * as __fd_glob_1 from "../content/docs/(root)/repo-structure.mdx?collection=docs"
import * as __fd_glob_0 from "../content/docs/(root)/blocks.mdx?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {}, {"(root)/blocks.mdx": __fd_glob_0, "(root)/repo-structure.mdx": __fd_glob_1, });