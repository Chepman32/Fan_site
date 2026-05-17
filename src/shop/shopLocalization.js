export function localizeShopProduct(product, copy = {}) {
  if (!product) return product

  const format = product.format?.match(/^(\d+)\s+emote PNGs$/)
    ? `${formatEmoteCount(Number(product.format.match(/^(\d+)/)?.[1]), copy)}`
    : copy.formats?.[product.format] || product.format

  return {
    ...product,
    title: copy.productTitles?.[product.id] || copy.productTitles?.[product.title] || product.title,
    categoryLabel: copy.categories?.[product.categoryId] || product.categoryLabel,
    previewLabel: copy.previewLabels?.[product.categoryId] || product.previewLabel,
    format,
    resolution: localizeResolution(product.resolution, copy),
    tags: product.tags?.map((tag) => copy.tags?.[tag] || tag) || [],
  }
}

export function localizeShopProducts(products = [], copy = {}) {
  return products.map((product) => localizeShopProduct(product, copy))
}

function formatEmoteCount(count, copy) {
  const labels = {
    zh: `${count} 个表情 PNG`,
    ru: `${count} PNG-эмоций`,
    it: `${count} emote PNG`,
    id: `${count} PNG emote`,
    pl: `${count} emotek PNG`,
    hi: `${count} इमोट PNG`,
    ms: `${count} PNG emote`,
  }

  return copy?.lang && labels[copy.lang] ? labels[copy.lang] : `${count} emote PNGs`
}

function localizeResolution(resolution, copy) {
  const eachMatch = resolution?.match(/^(.+)\s+each$/)
  if (eachMatch && copy.resolutionEach) {
    return copy.resolutionEach(eachMatch[1])
  }

  return resolution
}
