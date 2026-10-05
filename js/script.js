const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzccVJDYZrx0vbDLSJO_cl517jKYZ8NHPtwoU3MMG6w4dCPh0ECUDm-VE8VKAVETVNt/exec";
    const PENANDA   = "Pengajuan";
    const WA_NUMBER = "6281317768135";
    const WA_DISPLAY = "081317768135";
    const STORAGE_KEY = "pengajuan_history_sales";

    // ── DAFTAR PRODUK ──────────────────────────────────────
    const PRODUCTS = [
      "Selena",
      "D&g light blue",
      "Lacoste Sport",
      "Maid Prince",
      "Poloish",
      "Imperial",
      "White aoud",
      "Mia Tabac",
      "Coco Chanel",
      "Tobacco vanilla",
      "Al rehab lovely",
      "Indigo",
      "Vision",
      "Aqua kiss",
      "Roman 1a",
      "Pramugari air",
      "Purenol",
      "Body Wash (Tanpa Aroma)",
      "Body mist (Tanpa Aroma)",
      "Deodorant (Tanpa Aroma)",
      "Botol Parfum (Kosongan)"
    ];

    // ── STATE ──────────────────────────────────────────────
    const selected = new Set();
    let showOnlySelected = false;
    let toastTimer = null;

    // ── DOM REFS ───────────────────────────────────────────
    const tanggalInput   = document.getElementById('tanggalInput');
    const salesNameInput = document.getElementById('salesNameInput');
    const catatanInput   = document.getElementById('catatanInput');
    const searchBox      = document.getElementById('searchBox');
    const productGrid    = document.getElementById('productGrid');
    const badgeSelected  = document.getElementById('badgeSelected');
    const summaryCount   = document.getElementById('summaryCount');
    const summaryMain    = document.getElementById('summaryMain');
    const summarySub     = document.getElementById('summarySub');
    const btnSubmit      = document.getElementById('btnSubmit');
    const btnSubmitText  = document.getElementById('btnSubmitText');
    const btnOnlySelected = document.getElementById('btnOnlySelected');
    const toast          = document.getElementById('toast');

    // ── INIT ───────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
      // Set today's date
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      tanggalInput.value = `${yyyy}-${mm}-${dd}`;

      // Load last sales name
      const saved = localStorage.getItem('last_sales_name');
      if (saved) salesNameInput.value = saved;

      renderGrid();
    });

    // ── RENDER GRID ────────────────────────────────────────
    function renderGrid() {
      const kw = (searchBox.value || '').toLowerCase().trim();

      let filtered = PRODUCTS.filter(p => p.toLowerCase().includes(kw));
      if (showOnlySelected) filtered = filtered.filter(p => selected.has(p));

      productGrid.innerHTML = '';

      if (filtered.length === 0) {
        productGrid.innerHTML = `
          <div class="empty-state">
            <svg width="40" height="40" style="margin:0 auto 10px;color:var(--slate-300)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p style="font-weight:700;color:var(--slate-600)">${showOnlySelected ? 'Belum ada barang dipilih' : 'Tidak ada barang yang cocok'}</p>
          </div>`;
        return;
      }

      filtered.forEach(prod => {
        const isSelected = selected.has(prod);
        const card = document.createElement('div');
        card.className = `product-card${isSelected ? ' selected' : ''}`;
        card.dataset.prod = prod;
        card.setAttribute('role', 'checkbox');
        card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        card.addEventListener('click', () => toggleProduct(prod));

        card.innerHTML = `
          <div class="card-check">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div class="card-name">${escHtml(prod)}</div>
        `;

        productGrid.appendChild(card);
      });
    }

    // ── TOGGLE PRODUCT ─────────────────────────────────────
    function toggleProduct(prod) {
      if (selected.has(prod)) {
        selected.delete(prod);
      } else {
        selected.add(prod);
      }
      renderGrid();
      updateBar();
    }

    // ── TOGGLE ONLY-SELECTED FILTER ────────────────────────
    function toggleOnlySelected() {
      showOnlySelected = !showOnlySelected;
      btnOnlySelected.classList.toggle('active', showOnlySelected);
      btnOnlySelected.textContent = showOnlySelected ? 'Semua barang' : 'Pilihan saja';
      renderGrid();
    }

    // ── UPDATE BOTTOM BAR ──────────────────────────────────
    function updateBar() {
      const n = selected.size;
      badgeSelected.textContent = n;
      badgeSelected.classList.toggle('zero', n === 0);

      summaryCount.textContent = n;
      summaryCount.classList.toggle('zero', n === 0);

      summaryMain.textContent = `${n} barang dipilih`;
      if (n > 0) {
        const list = Array.from(selected).slice(0, 2).join(', ');
        summarySub.textContent = n <= 2 ? list : `${list}, +${n-2} lainnya`;
      } else {
        summarySub.textContent = 'Centang barang yang ingin diajukan';
      }

      btnSubmit.disabled = n === 0;
    }

    // ── GENERATE WA MESSAGE ────────────────────────────────
    function buildWAMessage(namaSales, tanggal, catatan, items) {
      const tgl = tanggal || '-';
      let msg = `*PENGAJUAN STOK BARANG*\n`;
      msg += `----------------------------\n`;
      msg += `📅 *Tanggal:* ${tgl}\n`;
      msg += `👤 *Sales:* ${namaSales}\n`;
      if (catatan) msg += `📝 *Catatan:* ${catatan}\n`;
      msg += `----------------------------\n`;
      msg += `*Barang yang Diajukan:*\n`;
      items.forEach((it, i) => {
        msg += `${i + 1}. ${it}\n`;
      });
      msg += `----------------------------\n`;
      msg += `*Total: ${items.length} macam barang*\n`;
      msg += `_Mohon segera diproses. Terima kasih._`;
      return msg;
    }

    // ── HANDLE SUBMIT ──────────────────────────────────────
    function handleSubmit() {
      const tanggal = tanggalInput.value;
      if (!tanggal) { showToast('Tanggal wajib diisi!', true); return; }

      const namaSales = (salesNameInput.value || '').trim();
      if (!namaSales) {
        showToast('Nama Sales wajib diisi!', true);
        salesNameInput.focus();
        return;
      }

      if (selected.size === 0) {
        showToast('Pilih minimal 1 barang!', true);
        return;
      }

      // Save last name
      localStorage.setItem('last_sales_name', namaSales);

      const catatan   = (catatanInput.value || '').trim();
      const items     = Array.from(selected);

      // Save to local history
      saveHistory({ id: 'REQ-' + Date.now(), tanggal, namaSales, catatan, items, createdAt: new Date().toISOString() });

      // Background sync to GAS
      const payload = { penanda: PENANDA, tanggal, namaSales, catatan, items };
      fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        keepalive: true
      }).catch(() => {});

      // Build WA message & redirect
      const msg = buildWAMessage(namaSales, tanggal, catatan, items);
      const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

      // Reset
      selected.clear();
      catatanInput.value = '';
      showOnlySelected = false;
      btnOnlySelected.classList.remove('active');
      btnOnlySelected.textContent = 'Pilihan saja';
      renderGrid();
      updateBar();

      showToast(`Pengajuan ${items.length} barang → WA`);

      // Open WA
      const win = window.open(waUrl, '_blank');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = waUrl;
      }
    }

    // ── LOCAL HISTORY ──────────────────────────────────────
    function saveHistory(record) {
      try {
        let hist = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        hist.unshift(record);
        if (hist.length > 50) hist = hist.slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(hist));
      } catch(e) {}
    }

    // ── TOAST ──────────────────────────────────────────────
    function showToast(msg, isError = false) {
      clearTimeout(toastTimer);
      toast.textContent = msg;
      toast.className = `toast show${isError ? ' error' : ''}`;
      toastTimer = setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }

    // ── ESCAPE HTML ────────────────────────────────────────
    function escHtml(s) {
      return String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
    }
