// @ts-nocheck
import { browser } from 'fumadocs-mdx/runtime/browser';
import type * as Config from '../source.config';

const create = browser<typeof Config, import("fumadocs-mdx/runtime/types").InternalTypeConfig & {
  DocData: {
  }
}>();
const browserCollections = {
  docs: create.doc("docs", {"adr/0001-modular-monolith.mdx": () => import("../content/docs/adr/0001-modular-monolith.mdx?collection=docs"), "architecture/component-map.mdx": () => import("../content/docs/architecture/component-map.mdx?collection=docs"), "architecture/data-contracts.mdx": () => import("../content/docs/architecture/data-contracts.mdx?collection=docs"), "architecture/invariants.mdx": () => import("../content/docs/architecture/invariants.mdx?collection=docs"), "architecture/system-design-v3.mdx": () => import("../content/docs/architecture/system-design-v3.mdx?collection=docs"), "dev/naming-convetions.mdx": () => import("../content/docs/dev/naming-convetions.mdx?collection=docs"), "dev/repo-structure.mdx": () => import("../content/docs/dev/repo-structure.mdx?collection=docs"), "ops/observality-model.mdx": () => import("../content/docs/ops/observality-model.mdx?collection=docs"), "safety/autonomy-levels.mdx": () => import("../content/docs/safety/autonomy-levels.mdx?collection=docs"), "overview/glossary.mdx": () => import("../content/docs/overview/glossary.mdx?collection=docs"), "overview/what-is-syris.mdx": () => import("../content/docs/overview/what-is-syris.mdx?collection=docs"), }),
};
export default browserCollections;