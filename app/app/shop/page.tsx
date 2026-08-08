import Image from 'next/image'
import { Download, ShoppingBag } from 'lucide-react'
import { BuyButton } from '@/components/buy-button'
import { getProducts } from '@/lib/data'
import { formatPrice } from '@/lib/pillars'

export default async function ShopPage() {
  const products = await getProducts()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-balance">Shop</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          digital modules to work through on your own, whenever you need them.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border">
          <ShoppingBag className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">nothing in the shop yet — check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {products.map((p) => (
            <div key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
              {p.cover_image && (
                <div className="relative aspect-[4/3] w-full bg-secondary">
                  <Image src={p.cover_image} alt={p.title} fill className="object-cover" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-5">
                <h2 className="font-serif text-lg font-semibold text-pretty">{p.title}</h2>
                <p className="flex-1 text-sm text-muted-foreground text-pretty">{p.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-serif text-xl font-semibold">{formatPrice(p.price_cents)}</span>
                  {p.owned ? (
                    p.file_url ? (
                      <a
                        href={p.file_url}
                        download
                        className="flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background"
                      >
                        <Download className="h-3.5 w-3.5" />
                        download
                      </a>
                    ) : (
                      <span className="rounded-full bg-secondary px-4 py-2 text-xs font-medium text-secondary-foreground">
                        owned
                      </span>
                    )
                  ) : (
                    <BuyButton productId={p.id} kind="product" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
