function normalizeCardText(value) {
  return value.toLowerCase().replace(/[^a-z\d]+/gi, ' ').trim().replace(/\s+/g, ' ');
}

export function matchListedCardProducts(offer, listedCardProducts) {
  const explicitCardName = typeof offer.cardName === 'string'
    && offer.cardName.trim() !== ''
    && offer.cardName !== 'Card eligibility unknown'
    ? normalizeCardText(offer.cardName)
    : null;
  const offerText = normalizeCardText([
    offer.title,
    offer.offerDescription,
    offer.description,
  ].filter((part) => typeof part === 'string').join(' '));

  return [...new Set(listedCardProducts.filter((cardProduct) => {
    const normalizedProduct = normalizeCardText(cardProduct);
    if (!normalizedProduct) return false;
    if (explicitCardName) return normalizedProduct === explicitCardName;
    return ` ${offerText} `.includes(` ${normalizedProduct} `);
  }))];
}
