// --- FILE KHUSUS LOGIKA / OTAK (script.js) ---

const kategoriPengeluaran = ["🍔 Makan", "🛵 Transport", "💡 Tagihan", "🛒 Belanja", "🎬 Hiburan", "➕ Lainnya"];
const kategoriPemasukan = ["💼 Gaji", "💻 Freelance", "🎁 Bonus", "📈 Investasi", "➕ Lainnya"];

// VARIABEL MEMORI SISTEM
let saldoSudahDiatur = false;
let saldoUtama = 0;
let totalPemasukan = 0;
let totalPengeluaran = 0;
let kategoriTerpilih = "";
let tipeTransaksi = "";
let saldoTersembunyi = false;
let daftarTransaksi = [];

// =========================================================================
// SISTEM ANTI-RESET (LOCAL STORAGE) - TANPA MEMORI NAMA
// =========================================================================
function simpanKeMemoriLokal() {
  const dataSimpanan = {
    saldoSudahDiatur: saldoSudahDiatur,
    saldoUtama: saldoUtama,
    totalPemasukan: totalPemasukan,
    totalPengeluaran: totalPengeluaran,
    daftarTransaksi: daftarTransaksi
  };
  localStorage.setItem('keiTrackData', JSON.stringify(dataSimpanan));
}

function muatDariMemoriLokal() {
  const dataTersimpan = localStorage.getItem('keiTrackData');
  if (dataTersimpan) {
    const data = JSON.parse(dataTersimpan);
    saldoSudahDiatur = data.saldoSudahDiatur || false;
    saldoUtama = data.saldoUtama || 0;
    totalPemasukan = data.totalPemasukan || 0;
    totalPengeluaran = data.totalPengeluaran || 0;
    daftarTransaksi = data.daftarTransaksi || [];

    if (saldoSudahDiatur) {
      document.getElementById("mode-input-saldo").style.display = "none";
      document.getElementById("mode-tampil-saldo").style.display = "block";
    }
    
    updateTampilanSaldo();
    updateTampilanLaporan();
    renderRiwayatHome();
  }
}

// 1. FUNGSI NAVIGASI
function bukaTab(namaTab, indexNav) {
  let semuaHalaman = document.querySelectorAll('.halaman');
  for (let i = 0; i < semuaHalaman.length; i++) {
    semuaHalaman[i].classList.remove('aktif');
  }

  let halamanTujuan = document.getElementById('halaman-' + namaTab);
  if (halamanTujuan) {
    halamanTujuan.classList.add('aktif');
  }

  if (indexNav !== null && indexNav !== undefined) {
    let semuaTombolNav = document.querySelectorAll('.navbar-bawah > button');
    for (let i = 0; i < semuaTombolNav.length; i++) {
      semuaTombolNav[i].classList.remove('aktif');
    }
    semuaTombolNav[indexNav].classList.add('aktif');
  }

  if (namaTab === 'laporan') {
    updateTampilanLaporan();
  } else if (namaTab === 'riwayat') {
    renderRiwayatLengkap();
  }
}

// 2. FUNGSI FORMAT RUPIAH
function formatRupiah(angka) {
  let number_string = angka.replace(/[^,\d]/g, '').toString();
  let split = number_string.split(',');
  let sisa = split[0].length % 3;
  let rupiah = split[0].substr(0, sisa);
  let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

  if (ribuan) {
    let separator = sisa ? '.' : '';
    rupiah += separator + ribuan.join('.');
  }
  
  if (split[1] !== undefined) {
    return rupiah + ',' + split[1];
  } else {
    return rupiah;
  }
}

document.getElementById('input-nominal').addEventListener('keyup', function() {
  this.value = formatRupiah(this.value);
});

document.getElementById('input-saldo-awal').addEventListener('keyup', function() {
  this.value = formatRupiah(this.value);
});

// 3. FUNGSI MEMBUKA FORM INPUT (NAMA SELALU DIKOSONGKAN!)
function bukaForm(tipe) {
  if (saldoSudahDiatur === false) {
    alert("⚠️ Eits! Kamu harus mengisi Total Saldo Awalmu dulu di Brankas sebelum bisa mencatat transaksi.");
    bukaTab('brankas', 3);
    return;
  }

  tipeTransaksi = tipe;
  kategoriTerpilih = ""; 
  
  let judul = document.getElementById("judul-form");
  if (tipe === "pengeluaran") {
    judul.innerText = "➖ Catat Pengeluaran Baru";
    judul.style.color = "#f43f5e";
  } else {
    judul.innerText = "➕ Catat Pemasukan Baru";
    judul.style.color = "#10b981";
  }

  let tempatKategori = document.getElementById("tempat-kategori");
  tempatKategori.innerHTML = "";
  
  let daftarKategori = (tipe === "pengeluaran") ? kategoriPengeluaran : kategoriPemasukan;
  
  for (let i = 0; i < daftarKategori.length; i++) {
    let kat = daftarKategori[i];
    let tombol = document.createElement("button");
    tombol.className = "tombol-kategori";
    tombol.innerText = kat;
    
    tombol.onclick = function() {
      let semuaTombolKat = document.querySelectorAll('.tombol-kategori');
      for (let j = 0; j < semuaTombolKat.length; j++) {
        semuaTombolKat[j].classList.remove('terpilih');
      }
      tombol.classList.add('terpilih');
      kategoriTerpilih = kat;
    };
    
    tempatKategori.appendChild(tombol);
  }

  // KOTAK NAMA SELALU KOSONG SETIAP MEMBUKA FORM
  document.getElementById("input-nama").value = "";
  document.getElementById("input-nominal").value = "";
  document.getElementById("input-sumber").value = "";
  document.getElementById("input-keterangan").value = "";

  bukaTab('form', null);
}

// 4. FUNGSI SIMPAN SALDO AWAL
function simpanSaldoAwal() {
  let inputRaw = document.getElementById("input-saldo-awal").value.replace(/\./g, '');
  let input = parseInt(inputRaw);
  
  if (isNaN(input) || input < 0) { 
    alert("Isi jumlah saldomu dengan benar ya!"); 
    return; 
  }

  saldoUtama = input;
  saldoSudahDiatur = true;

  document.getElementById("mode-input-saldo").style.display = "none";
  document.getElementById("mode-tampil-saldo").style.display = "block";
  
  updateTampilanSaldo();
  simpanKeMemoriLokal(); 

  alert("🎉 Saldo awal berhasil disimpan! Sekarang kamu bisa mulai mencatat.");
  bukaTab('home', 0);
}

// 5. FUNGSI SIMPAN TRANSAKSI (+ URL WEB APP TERBARU)
function simpanTransaksi() {
  let nama = document.getElementById("input-nama").value.trim();
  let nominalRaw = document.getElementById("input-nominal").value.replace(/\./g, '');
  let nominal = parseInt(nominalRaw);
  let sumber = document.getElementById("input-sumber").value;
  let keterangan = document.getElementById("input-keterangan").value;

  if (nama === "") { 
    alert("Nama kamu wajib diisi di kotak nomor 1 ya!"); return; 
  }
  if (isNaN(nominal) || nominal <= 0) { 
    alert("Nominal uangnya belum diisi!"); return; 
  }
  if (kategoriTerpilih === "") { 
    alert("Pilih kategori di tengah!"); return; 
  }
  if (sumber === "") { 
    alert("Sumber dana wajib diisi!"); return; 
  }

  let elemenFilterBulan = document.getElementById("filter-bulan");
  let bulanTersimpan = elemenFilterBulan ? elemenFilterBulan.value : "Juli 2026";
  if (bulanTersimpan === "Semua Bulan") bulanTersimpan = "Juli 2026";

  const idTransaksi = Date.now().toString();

  // --- KONEKSI KE GOOGLE SHEETS MENGGUNAKAN LINK BARUMU ---
  const scriptURL = "https://script.google.com/macros/s/AKfycbz45KNzUfeD05U__zuEK1rS9kk4HCJ8XctcXehhvQy_mVpdQPpRKIC4MhV3HrYRY8GOVg/exec";
  
  const data = {
    action: "insert",
    id: idTransaksi,
    tanggal: new Date().toLocaleDateString('id-ID'),
    bulan: bulanTersimpan,
    tipe: tipeTransaksi,
    kategori: kategoriTerpilih,
    nominal: nominal,
    sumber: sumber,
    notes: (keterangan !== "") ? keterangan : "-",
    nama: nama
  };

  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(() => {
    alert("✅ Data berhasil tersimpan ke Google Sheets!");
  })
  .catch(error => {
    alert("⚠️ Tersimpan di HP, tapi gagal kirim ke Google Sheets. Cek sinyal internet.");
  });

  if (tipeTransaksi === "pemasukan") {
    saldoUtama += nominal;
    totalPemasukan += nominal;
  } else {
    saldoUtama -= nominal;
    totalPengeluaran += nominal;
  }

  daftarTransaksi.push({
    id: idTransaksi, 
    nama: nama,
    tipe: tipeTransaksi,
    kategori: kategoriTerpilih,
    nominal: nominal,
    sumber: sumber,
    notes: (keterangan !== "") ? keterangan : "-",
    bulan: bulanTersimpan,
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  });

  updateTampilanSaldo();
  renderRiwayatHome();
  simpanKeMemoriLokal(); 
  bukaTab('home', 0);
}

// 6. FUNGSI HAPUS TRANSAKSI (+ URL WEB APP TERBARU)
function hapusTransaksi(idTarget) {
  let yakin = confirm("🗑️ Yakin ingin menghapus catatan ini? Saldo akan dikembalikan ke posisi semula.");
  if (!yakin) return;

  let indexTarget = -1;
  for (let i = 0; i < daftarTransaksi.length; i++) {
    if (daftarTransaksi[i].id === idTarget) {
      indexTarget = i;
      break;
    }
  }

  if (indexTarget !== -1) {
    let item = daftarTransaksi[indexTarget];

    if (item.tipe === "pemasukan") {
      saldoUtama -= item.nominal;
      totalPemasukan -= item.nominal;
    } else {
      saldoUtama += item.nominal;
      totalPengeluaran -= item.nominal;
    }

    daftarTransaksi.splice(indexTarget, 1);

    updateTampilanSaldo();
    updateTampilanLaporan();
    renderRiwayatHome();
    if (document.getElementById("halaman-riwayat").classList.contains("aktif")) {
      renderRiwayatLengkap();
    }
    simpanKeMemoriLokal();

    // --- PERINTAH HAPUS KE GOOGLE SHEETS MENGGUNAKAN LINK BARUMU ---
    const scriptURL = "https://script.google.com/macros/s/AKfycbz45KNzUfeD05U__zuEK1rS9kk4HCJ8XctcXehhvQy_mVpdQPpRKIC4MhV3HrYRY8GOVg/exec";
    const dataHapus = {
      action: "delete",
      id: idTarget
    };

    fetch(scriptURL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dataHapus)
    })
    .then(() => {
      alert("🗑️ Berhasil dihapus dari HP dan Google Sheets!");
    })
    .catch(() => {
      alert("⚠️ Terhapus dari HP, tapi gagal terhubung ke Google Sheets.");
    });
  }
}

// 7. RIWAYAT DI HOME (+ TAMPILKAN NAMA PENCATAT)
function renderRiwayatHome() {
  let wadahTombol = document.getElementById("wadah-tombol-home");
  let wadahRiwayat = document.getElementById("riwayat-singkat-home");
  let teksSambut = document.getElementById("teks-sambut-home");
  let judulRiwayat = document.getElementById("judul-riwayat-home");

  if (daftarTransaksi.length > 0) {
    wadahTombol.classList.add("mode-kompak");
    teksSambut.style.display = "none";
    judulRiwayat.style.display = "block";

    let empatTerakhir = daftarTransaksi.slice(-4).reverse();
    
    let html = "";
    for (let i = 0; i < empatTerakhir.length; i++) {
      let item = empatTerakhir[i];
      let warna = (item.tipe === "pemasukan") ? "#10b981" : "#f43f5e";
      let tanda = (item.tipe === "pemasukan") ? "+ " : "- ";
      let namaTampil = item.nama || "-";
      
      html += `
        <div class="item-riwayat">
          <div style="text-align: left; max-width: 55%;">
            <strong style="display:block; font-size:14px; color:#1e293b; margin-bottom: 2px;">${item.kategori}</strong>
            <span style="display:block; font-size:12px; color:#334155; font-style:italic; margin-bottom: 4px;">📝 "${item.notes}"</span>
            <div>
              <span style="display:inline-block; font-size:11px; color:#0d9488; background:#ccfbf1; padding:2px 8px; border-radius:8px; font-weight:bold; margin-right:4px;">👤 ${namaTampil}</span>
              <span style="display:inline-block; font-size:11px; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:8px;">💳 ${item.sumber}</span>
            </div>
          </div>
          <div class="wadah-kanan-riwayat">
            <strong style="color: ${warna}; font-size:13px;">${tanda}Rp ${item.nominal.toLocaleString("id-ID")}</strong>
            <button onclick="hapusTransaksi('${item.id}')" class="btn-hapus" title="Hapus catatan ini">🗑️</button>
          </div>
        </div>
      `;
    }
    wadahRiwayat.innerHTML = html;
  } else {
    wadahTombol.classList.remove("mode-kompak");
    teksSambut.style.display = "block";
    judulRiwayat.style.display = "none";
    wadahRiwayat.innerHTML = "";
  }
}

// 8. RIWAYAT LENGKAP DI TAB RIWAYAT (+ TAMPILKAN NAMA PENCATAT)
function renderRiwayatLengkap() {
  let wadahRiwayat = document.getElementById("wadah-riwayat-lengkap");
  let filterBulan = document.getElementById("filter-bulan").value;
  
  let transaksiTersaring = [];
  for (let i = 0; i < daftarTransaksi.length; i++) {
    let item = daftarTransaksi[i];
    if (filterBulan === "Semua Bulan" || item.bulan === filterBulan) {
      transaksiTersaring.push(item);
    }
  }

  if (transaksiTersaring.length === 0) {
    wadahRiwayat.innerHTML = '<p id="pesan-riwayat-kosong" style="color: #64748b; font-size: 13px; text-align: center; margin-top: 40px;">Belum ada transaksi yang dicatat untuk periode ini.</p>';
    return;
  }

  let transaksiTerbaruAtas = transaksiTersaring.slice().reverse();
  
  let html = "";
  for (let i = 0; i < transaksiTerbaruAtas.length; i++) {
    let item = transaksiTerbaruAtas[i];
    let warna = (item.tipe === "pemasukan") ? "#10b981" : "#f43f5e";
    let tanda = (item.tipe === "pemasukan") ? "+ " : "- ";
    let namaTampil = item.nama || "-";
    
    html += `
      <div class="item-riwayat">
        <div style="text-align: left; max-width: 55%;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <strong style="font-size:14px; color:#1e293b;">${item.kategori}</strong>
            <span style="font-size:10px; background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:6px; font-weight:bold;">📅 ${item.tanggal} (${item.bulan})</span>
          </div>
          <span style="display:block; font-size:12px; color:#334155; font-style:italic; margin-bottom: 4px;">📝 "${item.notes}"</span>
          <div>
            <span style="display:inline-block; font-size:11px; color:#0d9488; background:#ccfbf1; padding:2px 8px; border-radius:8px; font-weight:bold; margin-right:4px;">👤 ${namaTampil}</span>
            <span style="display:inline-block; font-size:11px; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:8px;">💳 ${item.sumber}</span>
          </div>
        </div>
        <div class="wadah-kanan-riwayat">
          <strong style="color: ${warna}; font-size:13px;">${tanda}Rp ${item.nominal.toLocaleString("id-ID")}</strong>
          <button onclick="hapusTransaksi('${item.id}')" class="btn-hapus" title="Hapus catatan ini">🗑️</button>
        </div>
      </div>
    `;
  }
  
  wadahRiwayat.innerHTML = html;
}

// 9. PERBARUI TAMPILAN SALDO & LAPORAN
function updateTampilanSaldo() {
  let elemenSaldo = document.getElementById("angka-saldo");
  if (saldoTersembunyi === false) {
    elemenSaldo.innerText = "Rp " + saldoUtama.toLocaleString("id-ID");
  } else {
    elemenSaldo.innerText = "Rp *********";
  }
}

function updateTampilanLaporan() {
  let bersih = totalPemasukan - totalPengeluaran;
  
  document.getElementById("laporan-masuk").innerText = "Rp " + totalPemasukan.toLocaleString("id-ID");
  document.getElementById("laporan-keluar").innerText = "Rp " + totalPengeluaran.toLocaleString("id-ID");
  document.getElementById("laporan-bersih").innerText = "Rp " + bersih.toLocaleString("id-ID");

  let pesanKosong = document.getElementById("pesan-laporan-kosong");
  if (totalPemasukan === 0 && totalPengeluaran === 0) {
    pesanKosong.style.display = "block";
  } else {
    pesanKosong.style.display = "none";
  }
}

// 10. FITUR PRIVASI
function toggleSaldo() {
  let elemenSaldo = document.getElementById("angka-saldo");
  let tombolPrivasi = document.getElementById("tombol-privasi");
  
  if (saldoTersembunyi === false) {
    elemenSaldo.innerText = "Rp *********";
    tombolPrivasi.innerText = "👁️ Tampilkan Angka";
    saldoTersembunyi = true;
  } else {
    elemenSaldo.innerText = "Rp " + saldoUtama.toLocaleString("id-ID");
    tombolPrivasi.innerText = "👁️ Sembunyikan Angka";
    saldoTersembunyi = false;
  }
}

// 11. RESET SALDO AWAL
function resetSaldoAwal() {
  let yakin = confirm("Yakin ingin mengubah saldo awal? Ini akan mereset hitungan saat ini.");
  if (yakin) {
    saldoSudahDiatur = false;
    saldoUtama = 0;
    totalPemasukan = 0;
    totalPengeluaran = 0;
    daftarTransaksi = [];
    
    document.getElementById("mode-input-saldo").style.display = "block";
    document.getElementById("mode-tampil-saldo").style.display = "none";
    document.getElementById("input-saldo-awal").value = "";
    
    document.getElementById("wadah-tombol-home").classList.remove("mode-kompak");
    document.getElementById("riwayat-singkat-home").innerHTML = "";
    document.getElementById("judul-riwayat-home").style.display = "none";
    document.getElementById("teks-sambut-home").style.display = "block";
    
    renderRiwayatLengkap();
    localStorage.removeItem('keiTrackData'); 
  }
}

// JALANKAN OTOMATIS SAAT WEB DIBUKA
window.onload = function() {
  muatDariMemoriLokal();
};