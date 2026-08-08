import Image from 'next/image'
import { AddProductForm } from '@/components/admin/product-form'
import { getProducts } from '@/lib/data'
import { formatPrice } from '@/lib/pillars'

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          what's for sale in the shop. Connect Stripe keys to take real payments.
        </p>
      </div>

      <AddProductForm />

      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-xl bg-card p-3 ring-1 ring-border">
            {p.cover_image && (
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary">
                <Image src={p.cover_image} alt="" fill className="object-cover" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.title}</p>
              <p className="text-xs text-muted-foreground">{formatPrice(p.price_cents)}</p>
              <p className="text-xs text-muted-foreground">{p.is_published ? 'published' : 'hidden'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
