/* PCDealFinder external deal-link guard.
   Keeps retailer URLs as real external navigations even when cards are
   hydrated/re-rendered by the live catalogue scripts. */
(function () {
  function normalizeUrl(value) {
    try {
      const raw = String(value || '').trim();
      if (!raw) return '';
      const url = new URL(raw, window.location.href);
      if (!/^https?:$/i.test(url.protocol)) return '';
      return url.href;
    } catch {
      return '';
    }
  }

  function handleDealClick(event) {
    const link = event.target.closest('a.dealButton, .categoryOffer a');
    if (!link) return;

    const url = normalizeUrl(link.getAttribute('href'));
    if (!url) return;

    link.setAttribute('href', url);
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');

    // Some catalogue/card layers can intercept the normal anchor navigation.
    // Open the already-validated retailer URL explicitly and stop the card
    // handlers from swallowing the click.
    event.preventDefault();
    event.stopPropagation();

    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    if (!opened) {
      // Popup blockers may prevent window.open; fall back to normal navigation.
      window.location.href = url;
    }
  }

  document.addEventListener('click', handleDealClick, true);
})();
