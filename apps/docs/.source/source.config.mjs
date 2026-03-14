// source.config.ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import rehypePrettyCode from "rehype-pretty-code";
var rehypePrettyCodeOptions = {
  theme: {
    light: "github-light",
    dark: "github-dark"
  }
};
var docs = defineDocs({
  dir: "content/docs"
});
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions: false,
    rehypePlugins: (v) => [[rehypePrettyCode, rehypePrettyCodeOptions], ...v]
  }
});
export {
  source_config_default as default,
  docs
};
