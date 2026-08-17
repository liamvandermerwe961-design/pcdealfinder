/* =========================================================
   PCDEALFINDER — BUILDER CONTROLS
   Budget slider + expanded game catalogue
========================================================= */

(function () {
  const games = [
    ['fortnite', 'Fortnite'],
    ['warzone', 'Call of Duty: Warzone'],
    ['gta', 'GTA V'],
    ['cyberpunk', 'Cyberpunk 2077'],
    ['valorant', 'Valorant'],
    ['cs2', 'Counter-Strike 2'],
    ['apex', 'Apex Legends'],
    ['minecraft', 'Minecraft'],
    ['rdr2', 'Red Dead Redemption 2'],
    ['helldivers2', 'Helldivers 2'],
    ['general', 'General gaming']
  ];

  function money(value) {
    return 'R' + Number(value).toLocaleString('en-ZA');
  }

  function setupBudgetSlider() {
    const old = document.getElementById('buildBudget');
    if (!old || old.type === 'range') return;

    const label = old.closest('label');
    if (!label) return;

    old.remove();

    const wrap = document.createElement('div');
    wrap.className = 'budgetSliderWrap';
    wrap.innerHTML = `
      <input id="buildBudget" class="budgetSlider" type="range" min="8000" max="50000" step="1000" value="15000" aria-label="Build budget">
      <div class="budgetSliderMeta">
        <span>R8,000</span>
        <strong id="buildBudgetValue">R15,000</strong>
        <span>R50,000</span>
      </div>
    `;

    label.appendChild(wrap);

    const slider = document.getElementById('buildBudget');
    const value = document.getElementById('buildBudgetValue');

    slider.addEventListener('input', () => {
      value.textContent = money(slider.value);
    });
  }

  function setupGames() {
    const select = document.getElementById('buildGame');
    if (!select) return;

    select.innerHTML = games.map(([value, label]) =>
      `<option value="${value}">${label}</option>`
    ).join('');
  }

  function setupLabels() {
    // Extend the builder's existing gameLabel() without changing its scoring logic.
    const original = window.gameLabel;
    window.gameLabel = function (game) {
      const match = games.find(([value]) => value === game);
      return match ? match[1] : (original ? original(game) : 'Gaming');
    };
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupBudgetSlider();
    setupGames();
    setupLabels();
  });
})();
