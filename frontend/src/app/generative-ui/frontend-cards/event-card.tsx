// Frontend-Driven Cards, step 1 — "Write the renderer". Verbatim, file name
// included (`app/event-card.tsx` on the page).
//
// `content` is typed as a StandardSchemaV1, not a zod 3 schema, so the page's
// `import { z } from "zod"` compiles on any zod with Standard Schema support (this repo is on zod 3.25.76).

// [1] frontend cards: the renderer
import { z } from "zod";
import type { ReactActivityMessageRenderer } from "@copilotkit/react-core/v2";

const contentSchema = z.object({
  title: z.string(),
  detail: z.string().optional(),
});

export const eventCardRenderer: ReactActivityMessageRenderer<
  z.infer<typeof contentSchema>
> = {
  activityType: "app-event-card", // [!code highlight]
  content: contentSchema,
  render: ({ content }) => (
    <div className="rounded-lg border p-4">
      <strong>{content.title}</strong>
      {content.detail ? <p>{content.detail}</p> : null}
    </div>
  ),
};
