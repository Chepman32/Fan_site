export function organizationJsonLd({ siteOrigin, siteName }) {
  return {
    '@type': 'Organization',
    '@id': `${siteOrigin}/#organization`,
    name: siteName,
    url: siteOrigin,
    logo: `${siteOrigin}/favicon-96x96.png`,
  }
}

export function websiteJsonLd({ siteOrigin, siteName, description }) {
  return {
    '@type': 'WebSite',
    '@id': `${siteOrigin}/#website`,
    url: siteOrigin,
    name: siteName,
    description,
    inLanguage: 'en-US',
    publisher: { '@id': `${siteOrigin}/#organization` },
  }
}

export function breadcrumbJsonLd({ id, items }) {
  return {
    '@type': 'BreadcrumbList',
    '@id': id,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function articleJsonLd({ id, headline, description, datePublished, dateModified, pageId, siteOrigin }) {
  return {
    '@type': 'Article',
    '@id': id,
    headline,
    description,
    datePublished,
    dateModified,
    mainEntityOfPage: { '@id': pageId },
    author: { '@id': `${siteOrigin}/#organization` },
    publisher: { '@id': `${siteOrigin}/#organization` },
  }
}

export function productJsonLd({ id, name, description, image, category, price, priceCurrency = 'USD', url }) {
  return {
    '@type': 'Product',
    '@id': id,
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    brand: {
      '@type': 'Brand',
      name: 'Leonida Loot',
    },
    category,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency,
      availability: 'https://schema.org/InStock',
      url,
    },
  }
}
