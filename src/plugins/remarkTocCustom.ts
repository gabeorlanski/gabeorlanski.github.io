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
          children: headings.map((h) => {
            const listItem: ListItem = {
              type: "listItem",
              spread: false,
              children: [
                {
                  type: "paragraph",
                  children: [
                    {
                      type: "link",
                      url: `#${h.slug}`,
                      children: [{ type: "text", value: h.text }],
                    } as Link,
                  ],
                },
              ],
            };
            // Indent h3s by wrapping in nested list
            if (h.depth === 3) {
              return {
                type: "listItem",
                spread: false,
                children: [
                  {
                    type: "list",
                    ordered: false,
                    spread: false,
                    children: [listItem],
                  } as List,
                ],
              } as ListItem;
            }
            return listItem;
          }),
        };

        // Replace [TOC] with the list
        parent.children.splice(index, 1, tocList);
      }
    });
  };
}
