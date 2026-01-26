import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import { loadLegalMarkdown } from "@/lib/legal";
import { PageWrap } from "@/components/ui/page-wrap";
import { TopBar } from "@/components/nav/mobile/top-bar/top-bar";
import { BackButton } from "@/components/nav/back-button";

const PAGE_TITLE = "Cookies Notice (Web)"
export const metadata = { title: `syris-nutrition | ${PAGE_TITLE}` };
export const dynamic = "force-static";

export default async function Page() {
  const md = await loadLegalMarkdown("cookies");

  return (
    <PageWrap className="prose prose-neutral dark:prose-invert">
        <TopBar>
            <BackButton />
            <p className="text-sm text-muted-foreground">{PAGE_TITLE}</p>
        </TopBar>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
      >
        {md}
      </ReactMarkdown>
    </PageWrap>
  );
}
