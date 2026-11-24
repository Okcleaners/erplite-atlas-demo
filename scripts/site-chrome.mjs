export function siteHeader(brandHref = "/images/quiet-orbit.svg#brand") {
  return `<header><div class="wrap top"><a class="brand" href="/" aria-label="Atlasade home"><svg class="qo-brand" aria-hidden="true"><use href="${brandHref}"/></svg>ATLAS<b>ADE</b></a><nav aria-label="Website"><a href="/features/">Feature Finder</a><a href="/day-with-atlasade/">Café day</a></nav></div></header>`;
}

export function siteFooter() {
  return '<footer class="wrap"><a href="/">Atlasade home</a><a href="/availability/">Product availability</a><a href="/faq/">Merchant FAQ</a><a href="/agents/">Agent guide</a></footer>';
}
