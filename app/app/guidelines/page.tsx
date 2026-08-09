export default function GuidelinesPage() {
  const items: [string, string][] = [
    ['this is a soft place to land', 'no shaming, no comparison, no fixing. share and receive with kindness.'],
    ["what's shared here stays here", "don't screenshot or repeat someone else's story outside this space."],
    ["you're never required to participate", 'read-only is always welcome. share only what feels right.'],
    ["disagreement is fine, disrespect isn't", 'you can push back on an idea without attacking a person.'],
    ['use block, mute, and report freely', "you don't owe anyone your attention. protecting your peace is always okay."],
    ['no solicitation or spam', "this isn't a place to sell, recruit, or promote outside offers."],
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Community Guidelines</h1>
        <p className="mt-1 text-sm text-muted-foreground text-pretty">the short version of how we take care of each other here.</p>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
        {items.map(([title, body]) => (
          <div key={title} className="border-b border-border pb-4 last:border-0 last:pb-0">
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground text-pretty">{body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-pretty">
        breaking these guidelines may result in content removal or account suspension, at the discretion of the Wild Honey team.
      </p>
    </div>
  )
}
