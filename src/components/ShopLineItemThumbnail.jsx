import { getShopProductThumbnail } from '../shop/shopData'
import './ShopLineItemThumbnail.css'

function cssImageUrl(value) {
  return value ? `url("${String(value).replaceAll('"', '\\"')}")` : undefined
}

function ShopLineItemThumbnail({ product }) {
  const thumbnail = getShopProductThumbnail(product)
  const style = thumbnail ? { '--shop-line-item-image': cssImageUrl(thumbnail) } : undefined

  return (
    <span
      className={thumbnail ? 'shop-line-item-thumbnail' : 'shop-line-item-thumbnail is-empty'}
      style={style}
      aria-hidden="true"
    />
  )
}

export default ShopLineItemThumbnail
