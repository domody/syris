// @ts-nocheck
import * as __fd_glob_13 from "../content/docs/safety/autonomy-levels.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/overview/what-is-syris.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/overview/glossary.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/ops/observality-model.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/dev/repo-structure.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/dev/naming-convetions.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/architecture/invariants.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/architecture/data-contracts.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/architecture/component-map.mdx?collection=docs"
import * as __fd_glob_4 from "../content/docs/adr/0001-modular-monolith.mdx?collection=docs"
import { default as __fd_glob_3 } from "../content/docs/overview/meta.json?collection=docs"
import { default as __fd_glob_2 } from "../content/docs/dev/meta.json?collection=docs"
import { default as __fd_glob_1 } from "../content/docs/architecture/meta.json?collection=docs"
import { default as __fd_glob_0 } from "../content/docs/meta.json?collection=docs"
import { server } from 'fumadocs-mdx/runtime/server';
import type * as Config from '../source.config';

const create = server<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>({"doc":{"passthroughs":["extractedReferences"]}});

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "architecture/meta.json": __fd_glob_1, "dev/meta.json": __fd_glob_2, "overview/meta.json": __fd_glob_3, }, {"adr/0001-modular-monolith.mdx": __fd_glob_4, "architecture/component-map.mdx": __fd_glob_5, "architecture/data-contracts.mdx": __fd_glob_6, "architecture/invariants.mdx": __fd_glob_7, "dev/naming-convetions.mdx": __fd_glob_8, "dev/repo-structure.mdx": __fd_glob_9, "ops/observality-model.mdx": __fd_glob_10, "overview/glossary.mdx": __fd_glob_11, "overview/what-is-syris.mdx": __fd_glob_12, "safety/autonomy-levels.mdx": __fd_glob_13, });