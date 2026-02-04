import SiteFrame from "../SiteFrame";

export default function RecommendedBooks() {
  const books = [
    {
      title: "The Power of Now: A Guide to Spiritual Enlightenment",
      author: "Eckhart Tolle",
      category: "Spirituality",
      subtitle: "Amazon",
      href: "https://amzn.to/4ro8nW9",
      imageUrl: "/books/the-power-of-now.jpg",
      description: "",
    },
    {
      title: "Choice Theory: A New Psychology of Personal Freedom",
      author: "William Glasser M.D.",
      category: "Psychology",
      subtitle: "Amazon",
      href: "https://amzn.to/4bvL4Fm",
      imageUrl: "/books/choice-theory.jpg",
      description: "",
    },
    {
      title: "Warning: Psychiatry Can Be Hazardous to Your Mental Health",
      author: "William Glasser M.D.",
      category: "Psychiatry",
      subtitle: "Amazon",
      href: "https://amzn.to/4qam5ek",
      imageUrl: "/books/warning-psychiatry.jpg",
      description: "",
    },
    {
      title: "12 Rules for Life: An Antidote to Chaos",
      author: "Jordan B. Peterson",
      category: "Self-Help",
      subtitle: "Amazon",
      href: "https://amzn.to/49TyXAP",
      imageUrl: "/books/12-rules-for-life.jpg",
      description: "",
    },
    {
      title: "Beyond Order: 12 More Rules for Life",
      author: "Jordan B. Peterson",
      category: "Self-Help",
      subtitle: "Amazon",
      href: "https://amzn.to/4rrFuIS",
      imageUrl: "/books/beyond-order.jpg",
      description: "",
    },
    {
      title: "We Who Wrestle with God: Perceptions of the Divine",
      author: "Jordan B. Peterson",
      category: "Spirituality",
      subtitle: "Amazon",
      href: "https://amzn.to/3M6M7kK",
      imageUrl: "/books/we-who-wrestle-with-god.jpg",
      description: "",
    },
    {
      title: "Can't Hurt Me: Master Your Mind and Defy the Odds",
      author: "David Goggins",
      category: "Self-Help",
      subtitle: "Amazon",
      href: "https://amzn.to/4tutXdJ",
      imageUrl: "/books/cant-hurt-me.jpg",
      description: "",
    },
  ];

  return (
    <SiteFrame>
      <h1 className="text-2xl font-semibold">Recommended Books</h1>
      <div className="mt-2 text-xs text-zinc-300">
        As an Amazon Associate I earn from qualifying purchases.
      </div>
      <p className="mt-3 text-zinc-300 text-sm">Curated reading recommendations.</p>

      <div className="mt-6 grid gap-3">
        {books.map((b) => (
          <a
            key={b.href}
            href={b.href}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl border border-zinc-800/70 bg-zinc-950/30 p-4 hover:bg-zinc-900/30"
          >
            <div className="flex gap-3">
              <div className="shrink-0">
                <div className="h-24 w-16 overflow-hidden rounded-md border border-zinc-800/70 bg-zinc-900/20">
                  {b.imageUrl ? (
                    <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-[10px] text-zinc-500">Cover</div>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-zinc-100 line-clamp-2">{b.title}</div>
                {b.author ? <div className="mt-1 text-xs text-zinc-300">{b.author}</div> : null}
                {b.category ? <div className="mt-1 text-[11px] text-zinc-500">{b.category}</div> : null}

                <div className="mt-3 flex items-center gap-2">
                  <div className="inline-flex items-center rounded-full border border-zinc-700/60 bg-zinc-800/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                    View on Amazon
                  </div>
                  <div className="text-[11px] text-zinc-400">(Amazon Affiliate Link)</div>
                </div>

                {b.description ? (
                  <details className="mt-3 rounded-xl border border-zinc-800/70 bg-zinc-900/10">
                    <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-zinc-100 bg-zinc-800/90 rounded-xl">
                      Description
                    </summary>
                    <div className="px-3 pb-3 pt-2 text-xs text-zinc-300 leading-relaxed">{b.description}</div>
                  </details>
                ) : null}
              </div>
            </div>
          </a>
        ))}
      </div>
    </SiteFrame>
  );
}
