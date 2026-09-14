import type { ToolContent } from "@/lib/toolContent";

/**
 * Renders the long-form half of a tool page: how-to steps, FAQs and an
 * optional closing note, from the per-tool copy in lib/toolContent.ts.
 *
 * One renderer, thirteen sets of copy — the layout is shared, the words are
 * not. Also emits FAQPage structured data so the questions are machine
 * readable rather than just visible text.
 */
export function ToolPageSections({ content, howTo }: { content: ToolContent; howTo: string }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="mt-16 space-y-12 border-t border-outline-variant/30 pt-12">
      <section aria-labelledby="how-to-heading">
        {/* `howTo` is passed as a ready-made phrase rather than derived from
            the heading — lowercasing a title would turn "HEIC to JPG" into
            "heic to jpg". */}
        <h2 id="how-to-heading" className="font-display text-xl font-semibold tracking-tight text-on-surface">
          How to {howTo}
        </h2>
        <ol className="mt-4 space-y-3">
          {content.steps.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-on-surface-variant">
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-container-high font-display text-xs font-semibold text-on-surface"
              >
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="font-display text-xl font-semibold tracking-tight text-on-surface">
          Frequently asked questions
        </h2>
        <dl className="mt-4 space-y-6">
          {content.faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-display text-base font-semibold text-on-surface">{faq.q}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {content.note && (
        <section
          aria-label="Technical note"
          className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-4"
        >
          <h2 className="mb-1.5 font-display text-sm font-semibold text-on-surface">Worth knowing</h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">{content.note}</p>
        </section>
      )}

      <script
        type="application/ld+json"
        // Built from our own static copy above, never from user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </div>
  );
}
