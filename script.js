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

// 3. FUNGSI MEMBUKA FORM INPUT
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

  alert("🎉 Saldo awal berhasil disimpan! Sekarang kamu bisa mulai mencatat.");
  bukaTab('home', 0);
}

// 5. FUNGSI SIMPAN TRANSAKSI
// 5. FUNGSI SIMPAN TRANSAKSI (TERKONEKSI KE GOOGLE SHEETS)
function simpanTransaksi() {
  let nominalRaw = document.getElementById("input-nominal").value.replace(/\./g, '');
  let nominal = parseInt(nominalRaw);
  let sumber = document.getElementById("input-sumber").value;
  let keterangan = document.getElementById("input-keterangan").value;

  if (isNaN(nominal) || nominal <= 0) { 
    alert("Nominal uangnya belum diisi!"); return; 
  }
  if (kategoriTerpilih === "") { 
    alert("Pilih kategori di tengah!"); return; 
  }
  if (sumber === "") { 
    alert("Sumber dana wajib diisi!"); return; 
  }

  // --- KONEKSI KE GOOGLE SHEETS ---
  const scriptURL = "https://script.google.com/macros/s/AKfycbyt6BNYNeE6c62UKqqfK-gyQMhvHaysQsk0cWDSGeqq_pLS8kDe8spn-AjfJWv45r7fxw/exec";
  
  const data = {
    tanggal: new Date().toLocaleDateString('id-ID'),
    bulan: document.getElementById("filter-bulan").value, // Mengikuti filter bulan
    tipe: tipeTransaksi,
    kategori: kategoriTerpilih,
    nominal: nominal,
    sumber: sumber,
    notes: (keterangan !== "") ? keterangan : "-"
  };

  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors', // Penting agar tidak kena blokir browser
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(() => {
    alert("✅ Data berhasil tersimpan ke Google Sheets!");
  })
  .catch(error => {
    alert("❌ Gagal tersimpan. Cek koneksi internet.");
    console.error('Error!', error);
  });
  // --------------------------------

  // Update Memori Lokal (Supaya aplikasi tetap jalan lancar)
  if (tipeTransaksi === "pemasukan") {
    saldoUtama += nominal;
    totalPemasukan += nominal;
  } else {
    saldoUtama -= nominal;
    totalPengeluaran += nominal;
  }

  daftarTransaksi.push({
    tipe: tipeTransaksi,
    kategori: kategoriTerpilih,
    nominal: nominal,
    sumber: sumber,
    notes: (keterangan !== "") ? keterangan : "-",
    bulan: document.getElementById("filter-bulan").value,
    tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  });

  updateTampilanSaldo();
  renderRiwayatHome();
  bukaTab('home', 0);
}
  
  alert("🎉 SUKSES DICATAT!\n\nKategori: " + kategoriTerpilih + "\nNominal: Rp " + nominal.toLocaleString("id-ID") + "\nPeriode: " + bulanTersimpan);
  
  bukaTab('home', 0);

// 6. FUNGSI RIWAYAT DI HOME (Mengecilkan Tombol & Tampilkan Maksimal 4)
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
      
      html += `
        <div class="item-riwayat">
          <div style="text-align: left; max-width: 65%;">
            <strong style="display:block; font-size:14px; color:#1e293b; margin-bottom: 2px;">${item.kategori}</strong>
            <span style="display:block; font-size:12px; color:#334155; font-style:italic; margin-bottom: 4px;">📝 "${item.notes}"</span>
            <span style="display:inline-block; font-size:11px; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:8px;">💳 ${item.sumber}</span>
          </div>
          <div style="text-align: right;">
            <strong style="color: ${warna}; font-size:14px; display:block;">${tanda}Rp ${item.nominal.toLocaleString("id-ID")}</strong>
          </div>
        </div>
      `;
    }
    wadahRiwayat.innerHTML = html;
  }
}

// 7. FUNGSI RIWAYAT LENGKAP DI TAB RIWAYAT + FILTER BULAN
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
    
    html += `
      <div class="item-riwayat">
        <div style="text-align: left; max-width: 65%;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
            <strong style="font-size:14px; color:#1e293b;">${item.kategori}</strong>
            <span style="font-size:10px; background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:6px; font-weight:bold;">📅 ${item.tanggal} (${item.bulan})</span>
          </div>
          <span style="display:block; font-size:12px; color:#334155; font-style:italic; margin-bottom: 4px;">📝 "${item.notes}"</span>
          <span style="display:inline-block; font-size:11px; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:8px;">💳 ${item.sumber}</span>
        </div>
        <div style="text-align: right;">
          <strong style="color: ${warna}; font-size:14px; display:block;">${tanda}Rp ${item.nominal.toLocaleString("id-ID")}</strong>
        </div>
      </div>
    `;
  }
  
  wadahRiwayat.innerHTML = html;
}

// 8. FUNGSI PERBARUI TAMPILAN SALDO & LAPORAN
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

// 9. FITUR PRIVASI (Sembunyikan Saldo)
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

// 10. FUNGSI RESET SALDO AWAL
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
  }
}