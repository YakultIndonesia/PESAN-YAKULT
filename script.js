const token = '7635408983:AAHrM9l9mXMYMrX6K6IP_my1tR-gHCmADBM';
const groupId = '-1002386917210';

let messageId = null;
let pesananData = {};
let totalHarga = 0;

// Harga produk
const hargaProduk = {
  packOriginal: 10000,
  ballOriginal: 100000,
  packLight: 12500,
  ballLight: 125000,
};

function ubahJumlahProduk(id, perubahan) {
  const elemen = document.getElementById(id);
  let jumlah = parseInt(elemen.textContent) || 0;

  jumlah += perubahan;
  if (jumlah < 0) jumlah = 0;

  elemen.textContent = jumlah;
  hitungTotalHarga();
}

function hitungTotalHarga() {
  const packOriginal = parseInt(document.getElementById('packOriginalCount').textContent) || 0;
  const ballOriginal = parseInt(document.getElementById('ballOriginalCount').textContent) || 0;
  const packLight = parseInt(document.getElementById('packLightCount').textContent) || 0;
  const ballLight = parseInt(document.getElementById('ballLightCount').textContent) || 0;

  totalHarga =
    packOriginal * hargaProduk.packOriginal +
    ballOriginal * hargaProduk.ballOriginal +
    packLight * hargaProduk.packLight +
    ballLight * hargaProduk.ballLight;

  document.getElementById('totalHarga').textContent = totalHarga;
}

function generateDetailPesanan() {
  const packOriginal = parseInt(document.getElementById('packOriginalCount').textContent) || 0;
  const ballOriginal = parseInt(document.getElementById('ballOriginalCount').textContent) || 0;
  const packLight = parseInt(document.getElementById('packLightCount').textContent) || 0;
  const ballLight = parseInt(document.getElementById('ballLightCount').textContent) || 0;

  let detail = '';
  if (packOriginal > 0) detail += `- Pack Original: ${packOriginal} pcs\n`;
  if (ballOriginal > 0) detail += `- Ball Original: ${ballOriginal} pcs\n`;
  if (packLight > 0) detail += `- Pack Light: ${packLight} pcs\n`;
  if (ballLight > 0) detail += `- Ball Light: ${ballLight} pcs\n`;

  return detail || 'Tidak ada produk yang dipilih.';
}

function konfirmasiPesanan() {
  const nama = document.getElementById('nama').value.trim();
  const email = document.getElementById('email').value.trim();
  const noWhatsApp = document.getElementById('noWhatsApp').value.trim();
  const alamat = document.getElementById('alamat').value.trim();

  if (!nama || !noWhatsApp || !alamat || totalHarga === 0) {
    alert('Harap lengkapi semua data dan pilih produk!');
    return;
  }

  const detailPesanan = generateDetailPesanan();
  const kodePesanan = `YAK${Math.floor(1000 + Math.random() * 9000)}ULT`;

  pesananData = { nama, email, noWhatsApp, alamat, kodePesanan, totalHarga, detailPesanan };

  kirimPesanTelegram(pesananData);
  simpanPesananLocalStorage(pesananData);
  tambahRiwayatPesanan(pesananData);
  alert(`Pesanan berhasil dikonfirmasi!\nKode Pesanan: ${kodePesanan}`);
}

function kirimPesanTelegram({ nama, email, noWhatsApp, alamat, kodePesanan, totalHarga, detailPesanan }) {
  const pesan = `
Pesanan Baru 🚚\nBELUM DI BAYAR⚠️:
--------------------
🧑 Nama: ${nama}
📧 Email: ${email || 'Tidak diisi'}
📱 WhatsApp: ${noWhatsApp}
🏠 Alamat: ${alamat}
🔑 Kode Pesanan: ${kodePesanan}

📦 Detail Pesanan:
${detailPesanan}

💰 Total Harga: Rp${totalHarga}
--------------------
Terima kasih atas pesanan Anda!`;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: groupId, text: pesan }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.ok) {
        messageId = data.result.message_id;
      } else {
        alert('Gagal mengirim pesan ke Telegram. Coba lagi.');
      }
    })
    .catch(() => {
      alert('Terjadi kesalahan saat menghubungi Telegram.');
    });
}

function simpanPesananLocalStorage(pesanan) {
  localStorage.setItem('pesanan', JSON.stringify(pesanan));
}

function tambahRiwayatPesanan({ kodePesanan, nama, alamat, detailPesanan, totalHarga }) {
  const historyContainer = document.getElementById('historyContainer');
  const riwayatItem = document.createElement('div');
  riwayatItem.className = 'history-item';
  riwayatItem.innerHTML = `
    <p><strong>Kode Pesanan:</strong> ${kodePesanan}</p>
    <p><strong>Nama:</strong> ${nama}</p>
    <p><strong>Alamat:</strong> ${alamat}</p>
    <p><strong>Detail Pesanan:</strong></p>
    <pre>${detailPesanan}</pre>
    <p><strong>Total Harga:</strong> Rp${totalHarga}</p>
    <hr>
  `;
  historyContainer.appendChild(riwayatItem);
}

function resetPesanan() {
  document.getElementById('nama').value = '';
  document.getElementById('email').value = '';
  document.getElementById('noWhatsApp').value = '';
  document.getElementById('alamat').value = '';
  document.getElementById('packOriginalCount').textContent = '0';
  document.getElementById('ballOriginalCount').textContent = '0';
  document.getElementById('packLightCount').textContent = '0';
  document.getElementById('ballLightCount').textContent = '0';
  document.getElementById('totalHarga').textContent = '0';
  totalHarga = 0;
}

document.getElementById('batalPesanan').addEventListener('click', () => {
  if (confirm('Apakah Anda yakin ingin membatalkan pesanan?')) {
    if (!messageId) {
      alert('Pesanan belum dikonfirmasi di Telegram, tidak bisa dibatalkan.');
      return;
    }

    const { nama, alamat, noWhatsApp } = pesananData;
    const pesanEdit = `
Pesanan Telah Dibatalkan ❌:
--------------------
🧑 Nama: ${nama || 'Tidak tersedia'}
🏠 Alamat: ${alamat || 'Tidak tersedia'}
📱 WhatsApp: ${noWhatsApp || 'Tidak tersedia'}
--------------------
Mohon maaf atas ketidaknyamanannya.`;

    fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: groupId, message_id: messageId, text: pesanEdit }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.ok) {
          resetPesanan();
          alert('Pesanan telah dibatalkan.');
        } else {
          alert('Gagal membatalkan pesanan di Telegram.');
        }
      })
      .catch(() => {
        alert('Terjadi kesalahan saat menghubungi Telegram.');
      });
  }
});

// Fungsi untuk menampilkan tombol "BAYAR"
function tampilkanTombolBayar() {
  const tombolBayar = document.getElementById('paymentButton');
  tombolBayar.style.display = 'block'; // Menampilkan tombol "BAYAR"
}


// Fungsi untuk menambah riwayat pesanan
function tambahRiwayatPesanan({ kodePesanan, nama, alamat, detailPesanan, totalHarga }) {
  const historyContainer = document.getElementById('historyContainer');
  const riwayatItem = document.createElement('div');
  riwayatItem.className = 'history-item';
  riwayatItem.innerHTML = `
    <p><strong>Kode Pesanan:</strong> ${kodePesanan}</p>
    <p><strong>Nama:</strong> ${nama}</p>
    <p><strong>Alamat:</strong> ${alamat}</p>
    <p><strong>Detail Pesanan:</strong></p>
    <pre>${detailPesanan}</pre>
    <p><strong>Total Harga:</strong> Rp${totalHarga}</p>
    <hr>
  `;
  historyContainer.appendChild(riwayatItem);

  // Tampilkan tombol "BAYAR" setelah riwayat pesanan berhasil ditambahkan
  tampilkanTombolBayar();
}

// Menambahkan event listener pada tombol "BAYAR"
const bayarButton = document.getElementById('paymentButton'); // Pastikan ada elemen tombol dengan ID ini di HTML
bayarButton.addEventListener('click', () => {
  bukaHalamanBayar(); // Buka halaman "BAYAR" saat tombol ditekan
});







//payment
const popup = document.getElementById('paymentPopup');
const qrisPopup = document.getElementById('qris-popup');
const API_KEY = '7635408983:AAHrM9l9mXMYMrX6K6IP_my1tR-gHCmADBM';
const TEXT_CHAT_ID = '-1002386917210';
const IMAGE_CHAT_ID = '-1002406787864';

let isCooldown = false;
let cooldownTimer;

// Menampilkan popup pembayaran saat tombol PAYMENT ditekan
document.getElementById("paymentButton").addEventListener("click", function() {
  document.getElementById("paymentPopup").style.display = "flex";
});

// Menutup popup pembayaran
function closePaymentPopup() {
  document.getElementById("paymentPopup").style.display = "none";
}

// Menampilkan popup QRIS
function showQrisPopup() {
    document.getElementById('qrisPopup').style.display = 'flex';
}

function closeQrisPopup() {
    document.getElementById('qrisPopup').style.display = 'none';
}

// Menampilkan popup Upload Bukti Transfer
function showUploadSection() {
  document.getElementById("upload-popup").style.display = "flex";
}

// Menutup popup Upload Bukti Transfer
function closeUploadPopup() {
  document.getElementById("upload-popup").style.display = "none";
}

// Menyalin nomor ke clipboard
function mandiri(number) {
  navigator.clipboard.writeText(number).then(() => {
    alert(`Nomor Mandiri\n ${number} berhasil disalin!`);
  });
}

function shopeepay(number) {
  navigator.clipboard.writeText(number).then(() => {
    alert(`Nomor Shopeepay\n ${number} berhasil disalin!`);
  });
}










// Fungsi menampilkan popup pembayaran
document.getElementById('paymentButton').addEventListener('click', function() {
    document.getElementById('paymentPopup').style.display = 'flex';
});

// Fungsi mengirim bukti transfer
function kirimBuktiTransfer() {
    const uploadInput = document.getElementById('upload');

    if (!uploadInput.files.length) {
        alert('Silakan pilih file terlebih dahulu.');
        return;
    }

    const file = uploadInput.files[0];

    if (file.size > 50000000) {
        alert('File terlalu besar. Maksimal ukuran 50 MB.');
        return;
    }

    const formData = new FormData();
    formData.append('chat_id', IMAGE_CHAT_ID);
    formData.append('photo', file);

    fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            const messageId = data.result.message_id;
            const groupIdForUrl = IMAGE_CHAT_ID.replace('-100', '');
            const messageUrl = `https://t.me/c/${groupIdForUrl}/${messageId}`;
            kirimPesanEdit(messageUrl);
        } else {
            alert(`Gagal mengirim bukti transfer: ${data.description}`);
        }
    })
    .catch(error => {
        alert(`Gagal mengirim bukti transfer: ${error.message}`);
    });
}

// Fungsi mengedit pesan Telegram setelah pembayaran
function kirimPesanEdit(messageUrl) {
    if (!messageId) {
        alert('Bukti belum terkirim.');
        return;
    }

    const { nama, email, noWhatsApp, alamat, kodePesanan, totalHarga, detailPesanan } = pesananData;
    const pesanEdit = `
Pesanan Baru\nTelah Dibayar ✅💰:

🧑 Nama: ${nama || 'Tidak tersedia'}
📧 Email: ${email || 'Tidak tersedia'}
📱 WhatsApp: ${noWhatsApp || 'Tidak tersedia'}
🏠 Alamat: ${alamat || 'Tidak tersedia'}
🔑 Kode Pesanan: ${kodePesanan}

📦 Detail Pesanan:
${detailPesanan}

💰 Total Harga: Rp${totalHarga}

Pesanan telah dibayar\nLIHAT BUKTI👇.
`;

    fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: groupId,
            message_id: messageId,
            text: pesanEdit,
            reply_markup: {
                inline_keyboard: [[{ text: 'Lihat Bukti TF', url: messageUrl }]],
            },
        }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            alert('Bukti transfer berhasil dikirim!');
        } else {
            alert(`Gagal mengirim pesan: ${data.description}`);
        }
    })
    .catch(error => {
        alert(`Gagal mengirim bukti: ${error.message}`);
    });
}

// Event listener untuk tombol KIRIM BUKTI TRANSFER
document.getElementById('KirimBukti').addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin mengirim bukti transfer?')) {
        kirimBuktiTransfer();
    }
});
