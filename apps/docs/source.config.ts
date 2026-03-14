import { defineDocs, defineConfig } from "fumadocs-mdx/config";
import rehypePrettyCode from "rehype-pretty-code";
import type { Options } from "rehype-pretty-code";

const rehypePrettyCodeOptions: Options = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
};
export const docs = defineDocs({
  dir: "content/docs",
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: false,

    rehypePlugins: (v) => [[rehypePrettyCode, rehypePrettyCodeOptions], ...v],
  },
});
