import { visit } from "unist-util-visit";
import type { Root, Paragraph, Text, Heading, List, ListItem, Link } from "mdast";
import GithubSlugger from "github-slugger";

// Finds [TOC] in your markdown and replaces it with a TOC of all h2/h3 headings
export function remarkTocCustom() {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    const headings: { depth: number; text: string; slug: string }[] = [];

    // First pass: collect all headings
    visit(tree, "heading", (node: Heading) => {
      if (node.depth >= 2 && node.depth <= 3) {
        const text = node.children
          .filter((child): child is Text => child.type === "text")
          .map((child) => child.value)
          .join("");
        headings.push({
          depth: node.depth,
          text,
          slug: slugger.slug(text),
        });
      }
    });

    // Second pass: find [TOC] marker and replace it
    visit(tree, "paragraph", (node: Paragraph, index, parent) => {
      if (!parent || index === undefined) return;

      const firstChild = node.children[0];
      if (
        firstChild?.type === "text" &&
        firstChild.value.trim() === "[TOC]"
      ) {
        if (headings.length === 0) {
          // No headings, just remove the marker
          parent.children.splice(index, 1);
          return;
        }

        // Build TOC as a nested list
        const tocList: List = {
          type: "list",
          ordered: false,
          spread: false,
          data: { hProperties: { className: ["toc-inline"] } },
          children: (() => {
            const items: ListItem[] = [];
            for (const h of headings) {
              const linkParagraph: Paragraph = {
                type: "paragraph",
                children: [
                  {
                    type: "link",
                    url: `#${h.slug}`,
                    children: [{ type: "text", value: h.text }],
                  } as Link,
                ],
              };

              if (h.depth === 2) {
                items.push({
                  type: "listItem",
                  spread: false,
                  children: [linkParagraph],
                });
              } else {
                // H3: nest under the preceding H2's listItem
                const parent = items[items.length - 1];
                if (parent) {
                  const lastChild = parent.children[parent.children.length - 1];
                  if (lastChild?.type === "list") {
                    // Append to existing nested list
                    (lastChild as List).children.push({
                      type: "listItem",
                      spread: false,
                      children: [linkParagraph],
                    });
                  } else {
                    // Create nested list under the H2
                    parent.children.push({
                      type: "list",
                      ordered: false,
                      spread: false,
                      children: [
                        {
                          type: "listItem",
                          spread: false,
                          children: [linkParagraph],
                        },
                      ],
                    } as List);
                  }
                } else {
                  // H3 before any H2: treat as top-level item
                  items.push({
                    type: "listItem",
                    spread: false,
                    children: [linkParagraph],
                  });
                }
              }
            }
            return items;
          })(),
        };

        // Wrap in a collapsible <details> element
        const detailsOpen = { type: "html", value: '<details class="toc-details"><summary>Table of Contents</summary>' } as const;
        const detailsClose = { type: "html", value: '</details>' } as const;
        parent.children.splice(index, 1, detailsOpen as any, tocList, detailsClose as any);
      }
    });
  };
}
