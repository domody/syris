// @ts-nocheck
import * as __fd_glob_36 from "../content/docs/safety/risk-and-gates.mdx?collection=docs"
import * as __fd_glob_35 from "../content/docs/safety/autonomy-levels.mdx?collection=docs"
import * as __fd_glob_34 from "../content/docs/proactive/watchers.mdx?collection=docs"
import * as __fd_glob_33 from "../content/docs/proactive/scheduler.mdx?collection=docs"
import * as __fd_glob_32 from "../content/docs/proactive/rules-engine.mdx?collection=docs"
import * as __fd_glob_31 from "../content/docs/overview/what-is-syris.mdx?collection=docs"
import * as __fd_glob_30 from "../content/docs/overview/glossary.mdx?collection=docs"
import * as __fd_glob_29 from "../content/docs/ops/secrets.mdx?collection=docs"
import * as __fd_glob_28 from "../content/docs/ops/failure-modes.mdx?collection=docs"
import * as __fd_glob_27 from "../content/docs/ops/db-schema.mdx?collection=docs"
import * as __fd_glob_26 from "../content/docs/observability/projections.mdx?collection=docs"
import * as __fd_glob_25 from "../content/docs/observability/health-and-alarms.mdx?collection=docs"
import * as __fd_glob_24 from "../content/docs/observability/audit-log.mdx?collection=docs"
import * as __fd_glob_23 from "../content/docs/observability/api-reference.mdx?collection=docs"
import * as __fd_glob_22 from "../content/docs/integrations/tool-runtime.mdx?collection=docs"
import * as __fd_glob_21 from "../content/docs/integrations/mcp.mdx?collection=docs"
import * as __fd_glob_20 from "../content/docs/integrations/inbound-adapter.mdx?collection=docs"
import * as __fd_glob_19 from "../content/docs/architecture/task-engine.mdx?collection=docs"
import * as __fd_glob_18 from "../content/docs/architecture/principles.mdx?collection=docs"
import * as __fd_glob_17 from "../content/docs/architecture/pipeline.mdx?collection=docs"
import * as __fd_glob_16 from "../content/docs/architecture/data-contracts.mdx?collection=docs"
import * as __fd_glob_15 from "../content/docs/architecture/component-map.mdx?collection=docs"
import * as __fd_glob_14 from "../content/docs/dev/testing-strategy.mdx?collection=docs"
import * as __fd_glob_13 from "../content/docs/dev/repo-structure.mdx?collection=docs"
import * as __fd_glob_12 from "../content/docs/dev/outstanding-decisions.mdx?collection=docs"
import * as __fd_glob_11 from "../content/docs/dev/naming-convetions.mdx?collection=docs"
import * as __fd_glob_10 from "../content/docs/dev/milestones.mdx?collection=docs"
import * as __fd_glob_9 from "../content/docs/dev/fast-path-intents.mdx?collection=docs"
import * as __fd_glob_8 from "../content/docs/archive/system-design-v3.mdx?collection=docs"
import * as __fd_glob_7 from "../content/docs/archive/observality-model.mdx?collection=docs"
import * as __fd_glob_6 from "../content/docs/archive/data-contracts.mdx?collection=docs"
import * as __fd_glob_5 from "../content/docs/adr/0002-mcp-integration.mdx?collection=docs"
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

export const docs = await create.docs("docs", "content/docs", {"meta.json": __fd_glob_0, "architecture/meta.json": __fd_glob_1, "dev/meta.json": __fd_glob_2, "overview/meta.json": __fd_glob_3, }, {"adr/0001-modular-monolith.mdx": __fd_glob_4, "adr/0002-mcp-integration.mdx": __fd_glob_5, "archive/data-contracts.mdx": __fd_glob_6, "archive/observality-model.mdx": __fd_glob_7, "archive/system-design-v3.mdx": __fd_glob_8, "dev/fast-path-intents.mdx": __fd_glob_9, "dev/milestones.mdx": __fd_glob_10, "dev/naming-convetions.mdx": __fd_glob_11, "dev/outstanding-decisions.mdx": __fd_glob_12, "dev/repo-structure.mdx": __fd_glob_13, "dev/testing-strategy.mdx": __fd_glob_14, "architecture/component-map.mdx": __fd_glob_15, "architecture/data-contracts.mdx": __fd_glob_16, "architecture/pipeline.mdx": __fd_glob_17, "architecture/principles.mdx": __fd_glob_18, "architecture/task-engine.mdx": __fd_glob_19, "integrations/inbound-adapter.mdx": __fd_glob_20, "integrations/mcp.mdx": __fd_glob_21, "integrations/tool-runtime.mdx": __fd_glob_22, "observability/api-reference.mdx": __fd_glob_23, "observability/audit-log.mdx": __fd_glob_24, "observability/health-and-alarms.mdx": __fd_glob_25, "observability/projections.mdx": __fd_glob_26, "ops/db-schema.mdx": __fd_glob_27, "ops/failure-modes.mdx": __fd_glob_28, "ops/secrets.mdx": __fd_glob_29, "overview/glossary.mdx": __fd_glob_30, "overview/what-is-syris.mdx": __fd_glob_31, "proactive/rules-engine.mdx": __fd_glob_32, "proactive/scheduler.mdx": __fd_glob_33, "proactive/watchers.mdx": __fd_glob_34, "safety/autonomy-levels.mdx": __fd_glob_35, "safety/risk-and-gates.mdx": __fd_glob_36, });