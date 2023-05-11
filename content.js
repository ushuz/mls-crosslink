// style adjustment
const style = document.head.appendChild(document.createElement('style'))
style.append(`
.listingheader-mortgage { display: none; }
`);
console.log('[mls-crosslink] style overrided');

// construct a link element
function link(label, href) {
  const link = document.createElement('a');
  link.setAttribute('target', '_blank');
  link.append(label);
  link.href = href;
  const span = document.createElement('span');
  span.setAttribute('naifei-zs-c', 'condoHunting');
  span.style.fontSize = 'small';
  span.style.fontWeight = '500';
  span.style.marginLeft = '1em';
  span.append(link);
  span.append(' ↗ ')
  return span;
}

function REWLink(mls) { return link('REW', `https://www.rew.ca/properties/search/build?listing_search%5Bquery%5D=${mls}`) }
function BCHLink(mls) { return link('BCH', `https://www.bccondosandhomes.com/listing/${mls}`) }

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// add cross links based on MLS no
async function linkMLS() {
  // depending on hostname, find MLS no and add link
  let linked, mlsContainer, mls;
  switch (location.hostname) {
    case 'www.rew.ca':
      // skip linked
      linked = !!document.querySelectorAll('[naifei-zs-c="condoHunting"]').length;
      if (linked) return console.log('[mls-crosslink] linked, skip');
      // otherwise, extract MLS no
      console.log('[mls-crosslink] adding link', { location });
      mlsContainer = document.evaluate('//section/div[starts-with(text(), "R2")]', document.body).iterateNext();
      mls = mlsContainer?.textContent;
      if (!mls) return console.log('[mls-crosslink] MLS not found');
      // next to MLS no
      mlsContainer.append(BCHLink(mls));
      // next to title
      document.querySelector('.listingheader-title').append(BCHLink(mls));
      // mark as linked
      linked = true;
      break;

    case 'www.bccondosandhomes.com':
      // skip linked
      linked = !!document.querySelectorAll('[naifei-zs-c="condoHunting"]').length;
      if (linked) return console.log('[mls-crosslink] linked, skip');
      // otherwise, extract MLS no
      console.log('[mls-crosslink] adding link', { location });
      mlsContainer = document.evaluate('//h2[contains(., "MLS: R")]', document.body).iterateNext();
      mls = mlsContainer?.textContent?.match(/MLS: (R\d+)/)?.[1];
      if (!mls) return console.log('[mls-crosslink] MLS not found');
      // next to title
      document.querySelector('h2.hidden-xs').append(REWLink(mls));
      // mark as linked
      linked = true;
      break;

    case 'bcres.paragonrels.com':
      if (location.pathname === '/publink/default.aspx') {
        mlsContainer = document.evaluate('//div[starts-with(text(), "R2")]', document.getElementsByName("fraDetail")[0]?.contentDocument).iterateNext();
        mls = mlsContainer?.textContent;
        if (!mls) return console.log('[mls-crosslink] MLS not found');
        // next to title toolbar
        document.getElementsByName("righttitle")[0]?.contentDocument.querySelectorAll('[naifei-zs-c="condoHunting"]').forEach(el => el.remove());
        document.getElementsByName("righttitle")[0]?.contentDocument.body.children[0].append(REWLink(mls));
        document.getElementsByName("righttitle")[0]?.contentDocument.body.children[0].append(BCHLink(mls));
        // mark as linked
        linked = true;
      }
      if (location.pathname.startsWith('/CollabCenter/') || location.pathname.startsWith('/CollabLink/')) {
        const isModalActive = !!document.querySelector('#modalDetail .address-detail');
        if (isModalActive) {
          // skip linked
          let linked = !!document.querySelector('#modalDetail .address-detail').parentElement.querySelectorAll('[naifei-zs-c="condoHunting"]').length;
          if (linked) return console.log('[mls-crosslink] linked, skip');
          // otherwise, extract MLS no
          console.log('[mls-crosslink] adding link', { location });
          mlsContainer = document.evaluate('//div[@id="modalDetail"]//span[starts-with(text(), "R")]', document.body).iterateNext();
          mls = mlsContainer?.textContent;
          if (!mls) return console.log('[mls-crosslink] MLS not found', { mlsContainer });
          // next to address detail
          document.querySelector('#modalDetail .address-detail').parentElement.append(REWLink(mls));
          document.querySelector('#modalDetail .address-detail').parentElement.append(BCHLink(mls));
          // mark as linked
          linked = true;
        } else {
          // while-loop iterate over all listings
          let evalutaion = document.evaluate('//div[@data-bind="attr: { id: LISTING_ID }"]//div[contains(text(), "ML #R")]', document.body);
          while (true) {
            try { mlsContainer = evalutaion.iterateNext(); }
            catch (error) {
              console.warn('[mls-crosslink] MLS container iteration error, retry', { error });
              evalutaion = document.evaluate('//div[@data-bind="attr: { id: LISTING_ID }"]//div[contains(text(), "ML #R")]', document.body);
              await sleep(500);
            }
            if (!mlsContainer) break;
            mls = mlsContainer.textContent.match(/ML #(R\d+)/)[1];
            if (mlsContainer.querySelectorAll('[naifei-zs-c="condoHunting"]').length) {
              console.log('[mls-crosslink] linked, skip', { mls });
              continue;
            }
            mlsContainer.append(REWLink(mls));
            mlsContainer.append(BCHLink(mls));
            console.log('[mls-crosslink] link added', { mls });
          }
        }
      }
  }
  if (linked) console.log('[mls-crosslink] link added', { mls });
}

// execute linkMLS() on DOM change
const observer = new MutationObserver(linkMLS);
observer.observe(document.body, { childList: true, subtree: true });
console.log(`[content.googleFamilySharing.js] DOM observing`);

// execute linkMLS() on frame load
const frame = document.getElementsByName("fraDetail")[0];
if (frame) {
  console.log('[mls-crosslink] listening to frame load');
  frame.addEventListener('load', linkMLS);
}
