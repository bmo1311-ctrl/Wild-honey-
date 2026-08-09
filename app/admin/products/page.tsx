import { AddProductForm } from '@/components/admin/product-form'
import { ProductRow } from '@/components/admin/product-row'
import { getProducts } from '@/lib/data'

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
          <ProductRow key={p.id} product={p} />
        ))}
      </div>
    </div>
  )
}
