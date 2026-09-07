import { StyleSetup } from '@/components/style-setup'
import { getStyleProfile } from '@/lib/data'

/**
 * Her colouring and her frame.
 *
 * Its own page rather than a panel on the board, because it is answered once
 * and then read forever — and because a question that lives permanently on a
 * page she visits daily is the exact friction she asked me to take out of
 * Protocols.
 */
export default async function StylePage() {
  const style = await getStyleProfile()
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-serif text-[29px] font-semibold leading-[1.1]">Your colours</h1>
        <p className="mt-1.5 text-[15px] leading-[1.5] text-pretty text-muted-foreground">
          Answered once. Everything the wardrobe says about an outfit is read from here.
        </p>
      </header>
      <StyleSetup
        initial={{
          season: style?.season ?? null,
          shape: style?.shape ?? null,
          vertical: style?.vertical ?? null,
          scale: style?.scale ?? null,
        }}
      />
    </div>
  )
}
