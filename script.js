// =====================================
// KONFIGURASI GOOGLE SHEETS
// =====================================

let scanLock = false;
let scanTerakhir = {
    id: "",
    waktu: 0
};
let resetStatusTimer = null;

const URL_GOOGLE_SHEETS =
    "https://script.google.com/macros/s/AKfycbzn9Sw74H4-GWQ7c_mVFPXYSnOkMLMbNjXDku0sjw01RedQeruRVWbG6DnvXzohuHo8/exec";


// =====================================
// KIRIM DATA ABSENSI KE GOOGLE SHEETS
// =====================================

function kirimKeGoogleSheets(data) {

    const params = new URLSearchParams({
        id: data.id,
        nama: data.nama,
        bagian: data.bagian,
        tanggal: data.tanggal,
        jamMasuk: data.jamMasuk || "",
        jamPulang: data.jamPulang || ""
    });

    const url =
        `${URL_GOOGLE_SHEETS}?${params.toString()}`;

    const img = new Image();

    img.src = url;

    console.log(
        "DATA ABSENSI DIKIRIM:",
        data
    );
}


// =====================================
// DATA ABSENSI LOKAL
// =====================================

let dataAbsensi = JSON.parse(
    localStorage.getItem("dataAbsensi")
) || [];


// =================================
// BERSIHKAN DATA ABSENSI LAMA
// DARI LOCAL STORAGE
// =================================

const tanggalSekarang =
    new Date();

const tanggalHariIni =
    tanggalSekarang.getFullYear() +
    "-" +
    String(
        tanggalSekarang.getMonth() + 1
    ).padStart(2, "0") +
    "-" +
    String(
        tanggalSekarang.getDate()
    ).padStart(2, "0");


// Data lama tetap ada di Google Sheets.
// Di browser kita cukup menyimpan data
// yang masih relevan.

dataAbsensi =
    dataAbsensi.filter(function(item) {

        let tanggalAbsensi =
            String(
                item.tanggal || ""
            ).trim();

        // Konversi DD/MM/YYYY
        // menjadi YYYY-MM-DD

        if (
            tanggalAbsensi.includes("/")
        ) {

            const bagianTanggal =
                tanggalAbsensi.split("/");

            if (
                bagianTanggal.length === 3
            ) {

                tanggalAbsensi =
                    bagianTanggal[2] +
                    "-" +
                    bagianTanggal[1].padStart(
                        2,
                        "0"
                    ) +
                    "-" +
                    bagianTanggal[0].padStart(
                        2,
                        "0"
                    );
            }
        }

        return (
            tanggalAbsensi ===
            tanggalHariIni
        );

    });


localStorage.setItem(
    "dataAbsensi",
    JSON.stringify(dataAbsensi)
);


// Hapus data lama yang belum memakai
// format Jam Masuk

dataAbsensi = dataAbsensi.filter(function(data) {

    return data.jamMasuk;

});


localStorage.setItem(
    "dataAbsensi",
    JSON.stringify(dataAbsensi)
);


// =====================================
// DATA KARYAWAN
// =====================================

const dataKaryawan = {};


// =====================================
// AMBIL DATA KARYAWAN DARI GOOGLE SHEETS
// =====================================

function ambilDataKaryawan() {

    const callbackName =
        "callbackKaryawan_" + Date.now();

    const script =
        document.createElement("script");


    window[callbackName] = function(data) {

        console.log(
            "DATA DARI GOOGLE SHEETS:",
            data
        );


        data.forEach(function(karyawan) {

            dataKaryawan[karyawan.id] = {

                nama: karyawan.nama,

                bagian: karyawan.bagian

            };

        });


        console.log(
            "DATA KARYAWAN BERHASIL DIMUAT:",
            dataKaryawan
        );


        tampilkanAbsensi();
        updateDashboard();
        


        delete window[callbackName];

        script.remove();

    };


    script.src =
        `${URL_GOOGLE_SHEETS}?action=getKaryawan&callback=${callbackName}`;


    script.onerror = function() {

        console.error(
            "GAGAL MENGAMBIL DATA KARYAWAN DARI GOOGLE SHEETS"
        );


        delete window[callbackName];

        script.remove();

    };


    document.body.appendChild(script);

}


// =====================================
// AMBIL DATA ABSENSI DARI GOOGLE SHEETS
// =====================================

function ambilDataAbsensi() {

    const callbackName =
        "callbackAbsensi_" + Date.now();

    const script =
        document.createElement("script");


    window[callbackName] = function(data) {

        console.log(
            "DATA ABSENSI DARI GOOGLE SHEETS:",
            data
        );


        // Data absensi dari Google Sheets
        dataAbsensi = data;


        // Simpan ke localStorage
        localStorage.setItem(
            "dataAbsensi",
            JSON.stringify(dataAbsensi)
        );


        // Tampilkan tabel
        tampilkanAbsensi();


        // Update dashboard
        updateDashboard();


        delete window[callbackName];

        script.remove();

    };


    script.src =
        `${URL_GOOGLE_SHEETS}?action=getAbsensi&callback=${callbackName}`;


    script.onerror = function() {

        console.error(
            "GAGAL MENGAMBIL DATA ABSENSI DARI GOOGLE SHEETS"
        );


        delete window[callbackName];

        script.remove();

    };


    document.body.appendChild(script);

}


// =====================================
// QR BERHASIL DI-SCAN
// =====================================

function berhasilScan(decodedText) {

    const status =
        document.getElementById("status");

    // =================================
    // LOCK SCAN
    // =================================

    if (scanLock) {
        return;
    }

    // =================================
    // BERSIHKAN TIMER RESET
    // =================================

    if (resetStatusTimer) {
        clearTimeout(resetStatusTimer);
        resetStatusTimer = null;
    }

    bunyiScan();

    scanLock = true;

    setTimeout(function() {
        scanLock = false;
    }, 3000);

    console.log(
        "QR TERBACA:",
        decodedText
    );

    // =================================
    // ID DARI QR
    // =================================

    const id =
        decodedText.trim();

    const waktuSekarang =
        Date.now();

    if (
        scanTerakhir.id === id &&
        waktuSekarang - scanTerakhir.waktu < 5000
    ) {
        return;
    }

    scanTerakhir.id = id;
    scanTerakhir.waktu = waktuSekarang;

    // =================================
    // WAKTU SEKARANG
    // =================================

    const sekarang =
        new Date();

    const tanggal =
        sekarang.toLocaleDateString(
            "id-ID",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            }
        );

    const jam =
        sekarang.toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            }
        );

    // =================================
    // TANGGAL FORMAT YYYY-MM-DD
    // =================================

    const tanggalHariIni =
        sekarang.getFullYear() +
        "-" +
        String(
            sekarang.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            sekarang.getDate()
        ).padStart(2, "0");

    // =================================
    // CEK ID KARYAWAN
    // =================================

    if (!dataKaryawan[id]) {

        status.innerHTML = `
            <div class="scan-result complete-result">

                <div class="result-icon">
                    !
                </div>

                <div class="result-title">
                    QR TIDAK TERDAFTAR
                </div>

                <div class="result-name">
                    ID: ${id}
                </div>

                <div class="result-note">
                    Data karyawan tidak ditemukan dalam database.
                    <br>
                    Silakan gunakan QR karyawan yang terdaftar.
                </div>

            </div>
        `;

        status.className =
            "status error";

        resetStatusTimer =
            setTimeout(function() {

                resetStatusOtomatis();

                scanTerakhir.id = id;
                scanTerakhir.waktu = Date.now();

            }, 3000);

        return;
    }

    const karyawan =
        dataKaryawan[id];

    // =================================
    // CARI ABSENSI HARI INI
    // =================================

    const absensiHariIni =
        dataAbsensi.filter(function(item) {

            let tanggalAbsensi =
                String(
                    item.tanggal || ""
                ).trim();

            // Konversi DD/MM/YYYY
            // menjadi YYYY-MM-DD

            if (
                tanggalAbsensi.includes("/")
            ) {

                const bagianTanggal =
                    tanggalAbsensi.split("/");

                if (
                    bagianTanggal.length === 3
                ) {

                    tanggalAbsensi =
                        bagianTanggal[2] +
                        "-" +
                        bagianTanggal[1].padStart(
                            2,
                            "0"
                        ) +
                        "-" +
                        bagianTanggal[0].padStart(
                            2,
                            "0"
                        );
                }
            }

            return (
                String(item.id).trim() ===
                String(id).trim() &&

                tanggalAbsensi ===
                tanggalHariIni
            );

        });

    // Ambil satu data absensi terakhir
    // jika sudah ada

    const absensiTerakhir =
        absensiHariIni.length > 0
            ? absensiHariIni[
                absensiHariIni.length - 1
            ]
            : null;

    console.log(
        "ABSENSI TERAKHIR:",
        absensiTerakhir
    );

    // =================================
    // BELUM ADA ABSENSI
    // → MASUK
    // =================================

    if (!absensiTerakhir) {

        const dataBaru = {

            id: id,

            nama:
                karyawan.nama,

            bagian:
                karyawan.bagian,

            tanggal:
                tanggal,

            jamMasuk:
                jam,

            jamPulang:
                ""

        };

        // Simpan lokal

        dataAbsensi.push(
            dataBaru
        );

        localStorage.setItem(
            "dataAbsensi",
            JSON.stringify(
                dataAbsensi
            )
        );

        // Kirim ke Google Sheets

        kirimKeGoogleSheets(
            dataBaru
        );

        // Tampilkan status

        status.innerHTML = `

            <div class="scan-result success-result">

                <div class="result-icon">
                    ✓
                </div>

                <div class="result-title">
                    ABSENSI MASUK BERHASIL
                </div>

                <div class="result-name">
                    ${karyawan.nama}
                </div>

                <div class="result-info">
                    ${karyawan.bagian}
                    &nbsp;•&nbsp;
                    ${id}
                </div>

                <div class="result-time">
                    ${jam}
                </div>

            </div>

        `;

        status.className =
            "status success";

        tampilkanAbsensi();

        updateDashboard();

        console.log(
            "ABSENSI MASUK:",
            dataBaru
        );

        resetStatusTimer =
            setTimeout(function() {

                resetStatusOtomatis();

            }, 3000);

        return;
    }

    // =================================
    // SUDAH MASUK
    // → PULANG
    // =================================

    if (!absensiTerakhir.jamPulang) {

        absensiTerakhir.jamPulang =
            jam;

        // Simpan perubahan

        localStorage.setItem(
            "dataAbsensi",
            JSON.stringify(
                dataAbsensi
            )
        );

        // Kirim perubahan ke Sheets

        kirimKeGoogleSheets(
            absensiTerakhir
        );

        // Tampilkan status

        status.innerHTML = `

            <div class="scan-result success-result">

                <div class="result-icon">
                    ✓
                </div>

                <div class="result-title">
                    ABSENSI PULANG BERHASIL
                </div>

                <div class="result-name">
                    ${karyawan.nama}
                </div>

                <div class="result-info">
                    ${karyawan.bagian}
                    &nbsp;•&nbsp;
                    ${id}
                </div>

                <div class="result-time">
                    ${jam}
                </div>

                <div class="result-detail">
                    Masuk:
                    ${absensiTerakhir.jamMasuk}

                    &nbsp;&nbsp;|&nbsp;&nbsp;

                    Pulang:
                    ${jam}
                </div>

            </div>

        `;

        status.className =
            "status success";

        tampilkanAbsensi();

        updateDashboard();

        console.log(
            "ABSENSI PULANG:",
            absensiTerakhir
        );

        resetStatusTimer =
            setTimeout(function() {

                resetStatusOtomatis();

            }, 3000);

        return;
    }

    // =================================
    // SUDAH MASUK DAN PULANG
    // → ABSENSI SUDAH LENGKAP
    // =================================

    status.innerHTML = `

        <div class="scan-result complete-result">

            <div class="result-icon">
                !
            </div>

            <div class="result-title">
                ABSENSI SUDAH LENGKAP
            </div>

            <div class="result-name">
                ${karyawan.nama}
            </div>

            <div class="result-info">
                ${karyawan.bagian}
                &nbsp;•&nbsp;
                ${id}
            </div>

            <div class="result-detail">
                Masuk:
                ${absensiTerakhir.jamMasuk}

                &nbsp;&nbsp;|&nbsp;&nbsp;

                Pulang:
                ${absensiTerakhir.jamPulang}
            </div>

            <div class="result-note">
                Karyawan sudah melakukan
                absensi hari ini.
            </div>

        </div>

    `;

    status.className =
        "status error";

    resetStatusTimer =
        setTimeout(function() {

            resetStatusOtomatis();

        }, 3000);

}


// =====================================
// TAMPILKAN RIWAYAT ABSENSI
// =====================================

function tampilkanAbsensi() {
    const tabel = document.getElementById("dataAbsensi");
    if (!tabel) return;

    tabel.innerHTML = "";

    const filterTanggal = document.getElementById("filterTanggal");

    let tanggalDipilih = "";

    if (filterTanggal && filterTanggal.value) {
        const bagianTanggal = filterTanggal.value.split("-");

        tanggalDipilih =
            bagianTanggal[2] + "/" +
            bagianTanggal[1] + "/" +
            bagianTanggal[0];
    } else {
        const sekarang = new Date();

        tanggalDipilih = sekarang.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    // Tampilkan semua karyawan
    const semuaID = Object.keys(dataKaryawan);

    semuaID.forEach(function(id, index) {

        const karyawan = dataKaryawan[id];

        // Cari absensi karyawan pada tanggal yang dipilih
        const records = dataAbsensi.filter(function(data) {
            return (
                data.id === id &&
                data.tanggal === tanggalDipilih
            );
        });

        // Jika ada data duplikat, prioritaskan yang sudah pulang
        const absensi =
            records.find(function(data) {
                return data.jamPulang;
            }) ||
            records.find(function(data) {
                return data.jamMasuk;
            }) ||
            null;

        let jamMasuk = "-";
        let jamPulang = "-";
        let statusAbsensi = "Belum Hadir";

        if (absensi) {

            jamMasuk = absensi.jamMasuk || "-";
            jamPulang = absensi.jamPulang || "-";

            if (absensi.jamMasuk && absensi.jamPulang) {
                statusAbsensi = "Hadir";
            } else if (absensi.jamMasuk) {
                statusAbsensi = "Belum Pulang";
            }
        }

        const baris = `
            <tr>
                <td>${index + 1}</td>
                <td>${id}</td>
                <td>${karyawan.nama}</td>
                <td>${karyawan.bagian}</td>
                <td>${tanggalDipilih}</td>
                <td>${jamMasuk}</td>
                <td>${jamPulang}</td>
                <td>
    <span class="badge-status ${statusAbsensi
        .toLowerCase()
        .replace(" ", "-")}">
        ${statusAbsensi}
    </span>
</td>
            </tr>
        `;

        tabel.innerHTML += baris;
    });

    // Jika data karyawan belum berhasil dimuat
    if (semuaID.length === 0) {
        tabel.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center;">
                    Memuat data karyawan...
                </td>
            </tr>
        `;
    }
}
// =====================================
// FILTER TANGGAL
// =====================================

const filterTanggal =
    document.getElementById("filterTanggal");

if (filterTanggal) {

    // Default tanggal hari ini
    const sekarang = new Date();

    const tahun =
        sekarang.getFullYear();

    const bulan =
        String(
            sekarang.getMonth() + 1
        ).padStart(2, "0");

    const hari =
        String(
            sekarang.getDate()
        ).padStart(2, "0");

    filterTanggal.value =
        `${tahun}-${bulan}-${hari}`;


    // Ketika tanggal diganti
    filterTanggal.addEventListener(
    "change",
    function() {

        tampilkanAbsensi();

        updateDashboard();

    }
);

}


// =====================================
// DASHBOARD
// =====================================

// =====================================
// UPDATE DASHBOARD SESUAI FILTER TANGGAL
// =====================================

function updateDashboard() {
    const total = Object.keys(dataKaryawan).length;

    const filterTanggal = document.getElementById("filterTanggal");

    let tanggalDipilih = "";

    if (filterTanggal && filterTanggal.value) {
        const bagianTanggal = filterTanggal.value.split("-");

        tanggalDipilih =
            bagianTanggal[2] + "/" +
            bagianTanggal[1] + "/" +
            bagianTanggal[0];
    } else {
        const sekarang = new Date();

        tanggalDipilih = sekarang.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    }

    let sudahMasuk = 0;
    let belumPulang = 0;
    let sudahPulang = 0;
    let belumHadir = 0;

    // Hitung berdasarkan karyawan, bukan jumlah baris Absensi
    Object.keys(dataKaryawan).forEach(function(id) {

        const records = dataAbsensi.filter(function(data) {
            return (
                data.id === id &&
                data.tanggal === tanggalDipilih
            );
        });

        // Jika ada data duplikat, prioritaskan data yang sudah pulang
        const absensi =
            records.find(function(data) {
                return data.jamPulang;
            }) ||
            records.find(function(data) {
                return data.jamMasuk;
            }) ||
            null;

        if (absensi && absensi.jamMasuk) {
            sudahMasuk++;
        }

        if (absensi && absensi.jamMasuk && !absensi.jamPulang) {
            belumPulang++;
        }

        if (absensi && absensi.jamPulang) {
            sudahPulang++;
        }
    });

    const totalElement = document.getElementById("totalKaryawan");
    const masukElement = document.getElementById("sudahMasuk");
    const belumPulangElement = document.getElementById("belumPulang");
    const pulangElement = document.getElementById("sudahPulang");

    if (totalElement) {
        totalElement.textContent = total;
    }

    if (masukElement) {
        masukElement.textContent = sudahMasuk;
    }

    if (belumPulangElement) {
        belumPulangElement.textContent = belumPulang;
    }

    if (pulangElement) {
        pulangElement.textContent = sudahPulang;
    }
const belumHadirElement = document.getElementById("belumHadir");

if (belumHadirElement) {
    belumHadirElement.textContent = total - sudahMasuk;
}
}


// =====================================
// KONFIGURASI SCANNER
// =====================================

const scanner =
    new Html5Qrcode("reader");


const konfigurasi = {

    fps: 10,

    qrbox: {

        width: 250,

        height: 250

    }

};


// =====================================
// JALANKAN KAMERA
// =====================================

scanner.start(

    {
        facingMode: "environment"
    },

    konfigurasi,

    berhasilScan,

    function(errorMessage) {

        // Tidak melakukan apa-apa
        // ketika QR belum ditemukan

    }

).catch(function(error) {


    console.error(error);


    const status =
        document.getElementById(
            "status"
        );


    status.innerHTML = `

        Kamera tidak dapat digunakan.

        <br>

        Pastikan izin kamera diberikan.

    `;


    status.className =
        "status error";

});


// =====================================
// TAMPILKAN DATA SAAT WEBSITE DIBUKA
// =====================================

tampilkanAbsensi();


// Ambil data karyawan dari Sheets

ambilDataKaryawan();


// Ambil data absensi dari Sheets

ambilDataAbsensi();
const btnRefresh = document.getElementById("btnRefresh");


if (btnRefresh) {
    btnRefresh.addEventListener("click", function() {

        btnRefresh.disabled = true;
        btnRefresh.textContent = "⏳ Memuat...";

        ambilDataKaryawan();
        ambilDataAbsensi();

        setTimeout(function() {
            btnRefresh.disabled = false;
            btnRefresh.textContent = "🔄 Refresh Data";
        }, 1500);
    });
}
function resetStatus() {
    const status = document.getElementById("status");

    if (!status) return;

    status.innerHTML = "Menunggu scan...";
    status.className = "status";
}
// =========================
// SUARA SCAN
// =========================

function bunyiScan() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 1000;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.2
    );

    oscillator.start();

    oscillator.stop(audioContext.currentTime + 0.2);
}
// =========================
// MODE LAYAR PENUH
// =========================

const btnFullscreen = document.getElementById("btnFullscreen");

if (btnFullscreen) {

    btnFullscreen.addEventListener("click", function() {

        if (!document.fullscreenElement) {

            document.documentElement.requestFullscreen();

            btnFullscreen.textContent = "✕ Keluar Layar Penuh";

        } else {

            document.exitFullscreen();

            btnFullscreen.textContent = "⛶ Layar Penuh";
        }

    });

    document.addEventListener("fullscreenchange", function() {

        if (document.fullscreenElement) {
            btnFullscreen.textContent = "✕ Keluar Layar Penuh";
        } else {
            btnFullscreen.textContent = "⛶ Layar Penuh";
        }

    });
}
// =========================
// DOWNLOAD LAPORAN EXCEL
// =========================

const btnDownload = document.getElementById("btnDownload");

if (btnDownload) {
    btnDownload.addEventListener("click", async function () {

        try {

            btnDownload.disabled = true;
            btnDownload.textContent = "⏳ Membuat Excel...";

            // =========================
            // TENTUKAN TANGGAL
            // =========================

            const filterTanggal =
                document.getElementById("filterTanggal");

            let tanggalDipilih = "";

            if (filterTanggal && filterTanggal.value) {

                const bagianTanggal =
                    filterTanggal.value.split("-");

                tanggalDipilih =
                    bagianTanggal[2] + "/" +
                    bagianTanggal[1] + "/" +
                    bagianTanggal[0];

            } else {

                const sekarang = new Date();

                tanggalDipilih =
                    sekarang.toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                    });
            }


            // =========================
            // WORKBOOK
            // =========================

            const workbook =
                new ExcelJS.Workbook();

            workbook.creator =
                "PT. Sinar Emas Kahuripan";

            workbook.created = new Date();


            const worksheet =
                workbook.addWorksheet(
                    "Laporan Absensi"
                );


            // =========================
            // KOLOM
            // =========================

            worksheet.columns = [

                {
                    key: "no",
                    width: 7
                },

                {
                    key: "id",
                    width: 14
                },

                {
                    key: "nama",
                    width: 25
                },

                {
                    key: "bagian",
                    width: 18
                },

                {
                    key: "tanggal",
                    width: 16
                },

                {
                    key: "masuk",
                    width: 16
                },

                {
                    key: "pulang",
                    width: 16
                },

                {
                    key: "status",
                    width: 18
                }

            ];


            // =========================
            // HEADER PERUSAHAAN
            // =========================

            worksheet.mergeCells("B1:H1");

            worksheet.mergeCells("B2:H2");

            worksheet.mergeCells("B3:H3");


            worksheet.getCell("B1").value =
                "PT. SINAR EMAS KAHURIPAN";

            worksheet.getCell("B2").value =
                "LAPORAN ABSENSI KARYAWAN";

            worksheet.getCell("B3").value =
                "Tanggal: " + tanggalDipilih;


            worksheet.getCell("B1").font = {
                bold: true,
                size: 18
            };

            worksheet.getCell("B2").font = {
                bold: true,
                size: 14
            };

            worksheet.getCell("B3").font = {
                italic: true,
                size: 11
            };


            worksheet.getCell("B1").alignment = {
                horizontal: "center",
                vertical: "middle"
            };

            worksheet.getCell("B2").alignment = {
                horizontal: "center",
                vertical: "middle"
            };

            worksheet.getCell("B3").alignment = {
                horizontal: "center",
                vertical: "middle"
            };


            worksheet.getRow(1).height = 30;
            worksheet.getRow(2).height = 25;
            worksheet.getRow(3).height = 22;


            // =========================
            // LOGO
            // =========================

            const logoBase64 =
                await new Promise(function(resolve, reject) {

                    const img = new Image();

                    img.onload = function () {

                        const canvas =
                            document.createElement("canvas");

                        canvas.width =
                            img.naturalWidth;

                        canvas.height =
                            img.naturalHeight;

                        const ctx =
                            canvas.getContext("2d");

                        ctx.drawImage(
                            img,
                            0,
                            0,
                            img.naturalWidth,
                            img.naturalHeight
                        );

                        resolve(
                            canvas.toDataURL("image/png")
                        );
                    };

                    img.onerror = function () {

                        reject(
                            "Logo tidak ditemukan"
                        );

                    };

                    img.src = "logo.png";

                });


            const imageId =
                workbook.addImage({

                    base64: logoBase64,

                    extension: "png"

                });


            worksheet.addImage(
                imageId,
                {
                    tl: {
                        col: 0.3,
                        row: 0.2
                    },

                    ext: {
                        width: 90,
                        height: 90
                    }
                }
            );


            // =========================
            // REKAP
            // =========================

            worksheet.mergeCells("A5:H5");

            worksheet.getCell("A5").value =
                "REKAP ABSENSI";


            worksheet.getCell("A5").font = {
                bold: true,
                size: 13
            };


            worksheet.getCell("A5").alignment = {
                horizontal: "center",
                vertical: "middle"
            };


            // =========================
            // HITUNG REKAP
            // =========================

            let jumlahMasuk = 0;

            let jumlahBelumPulang = 0;

            let jumlahPulang = 0;

            let jumlahBelumHadir = 0;


            Object.keys(dataKaryawan)
                .forEach(function(id) {

                    const records =
                        dataAbsensi.filter(
                            function(data) {

                                return (
                                    data.id === id &&
                                    data.tanggal ===
                                    tanggalDipilih
                                );

                            }
                        );


                    const absensi =
                        records.find(
                            function(data) {

                                return data.jamPulang;

                            }
                        ) ||

                        records.find(
                            function(data) {

                                return data.jamMasuk;

                            }
                        ) ||

                        null;


                    if (!absensi) {

                        jumlahBelumHadir++;

                    }

                    else if (
                        absensi.jamMasuk &&
                        absensi.jamPulang
                    ) {

                        jumlahPulang++;

                    }

                    else if (
                        absensi.jamMasuk
                    ) {

                        jumlahBelumPulang++;

                    }

                });


            jumlahMasuk =
                jumlahBelumPulang +
                jumlahPulang;


            // =========================
            // KOTAK REKAP
            // =========================

            worksheet.getCell("A7").value =
                "TOTAL KARYAWAN";

            worksheet.getCell("B7").value =
                Object.keys(dataKaryawan).length;


            worksheet.getCell("C7").value =
                "SUDAH MASUK";

            worksheet.getCell("D7").value =
                jumlahMasuk;


            worksheet.getCell("E7").value =
                "BELUM PULANG";

            worksheet.getCell("F7").value =
                jumlahBelumPulang;


            worksheet.getCell("G7").value =
                "SUDAH PULANG";

            worksheet.getCell("H7").value =
                jumlahPulang;


            for (
                let col = 1;
                col <= 8;
                col++
            ) {

                const cell =
                    worksheet.getCell(7, col);

                cell.font = {
                    bold: true
                };

                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle"
                };

                cell.border = {

                    top: {
                        style: "thin"
                    },

                    left: {
                        style: "thin"
                    },

                    bottom: {
                        style: "thin"
                    },

                    right: {
                        style: "thin"
                    }

                };

            }


            worksheet.getRow(7).height = 25;


            // =========================
            // HEADER TABEL
            // =========================

            const headerRow = 9;


            const headers = [

                "No",

                "ID",

                "Nama",

                "Bagian",

                "Tanggal",

                "Jam Masuk",

                "Jam Pulang",

                "Status"

            ];


            headers.forEach(
                function(header, index) {

                    const cell =
                        worksheet.getCell(
                            headerRow,
                            index + 1
                        );


                    cell.value = header;


                    cell.font = {
                        bold: true,
                        size: 11
                    };


                    cell.alignment = {

                        horizontal: "center",

                        vertical: "middle",

                        wrapText: true

                    };


                    cell.border = {

                        top: {
                            style: "thin"
                        },

                        left: {
                            style: "thin"
                        },

                        bottom: {
                            style: "thin"
                        },

                        right: {
                            style: "thin"
                        }

                    };

                }
            );


            worksheet.getRow(headerRow).height = 28;


            // =========================
            // DATA ABSENSI
            // =========================

            let nomor = 1;


            Object.keys(dataKaryawan)
                .forEach(function(id) {

                    const karyawan =
                        dataKaryawan[id];


                    const records =
                        dataAbsensi.filter(
                            function(data) {

                                return (
                                    data.id === id &&
                                    data.tanggal ===
                                    tanggalDipilih
                                );

                            }
                        );


                    const absensi =
                        records.find(
                            function(data) {

                                return data.jamPulang;

                            }
                        ) ||

                        records.find(
                            function(data) {

                                return data.jamMasuk;

                            }
                        ) ||

                        null;


                    let jamMasuk = "-";

                    let jamPulang = "-";

                    let status =
                        "Belum Hadir";


                    if (absensi) {

                        jamMasuk =
                            absensi.jamMasuk || "-";

                        jamPulang =
                            absensi.jamPulang || "-";


                        if (
                            absensi.jamMasuk &&
                            absensi.jamPulang
                        ) {

                            status = "Hadir";

                        }

                        else {

                            status =
                                "Belum Pulang";

                        }

                    }


                    const row =
                        worksheet.addRow({

                            no: nomor,

                            id: id,

                            nama: karyawan.nama,

                            bagian: karyawan.bagian,

                            tanggal: tanggalDipilih,

                            masuk: jamMasuk,

                            pulang: jamPulang,

                            status: status

                        });


                    // Border seluruh sel

                    row.eachCell(
                        function(cell) {

                            cell.border = {

                                top: {
                                    style: "thin"
                                },

                                left: {
                                    style: "thin"
                                },

                                bottom: {
                                    style: "thin"
                                },

                                right: {
                                    style: "thin"
                                }

                            };


                            cell.alignment = {

                                vertical:
                                    "middle"

                            };

                        }
                    );


                    // Tengah

                    [
                        1,
                        2,
                        5,
                        6,
                        7,
                        8

                    ].forEach(
                        function(col) {

                            row.getCell(col)
                                .alignment = {

                                    horizontal:
                                        "center",

                                    vertical:
                                        "middle"

                                };

                        }
                    );


                    // Status

                    const statusCell =
                        row.getCell(8);


                    statusCell.font = {
                        bold: true
                    };


                    if (status === "Hadir") {

                        statusCell.fill = {

                            type: "pattern",

                            pattern: "solid",

                            fgColor: {
                                argb: "E2F0D9"
                            }

                        };

                    }


                    else if (
                        status ===
                        "Belum Pulang"
                    ) {

                        statusCell.fill = {

                            type: "pattern",

                            pattern: "solid",

                            fgColor: {
                                argb: "FFF2CC"
                            }

                        };

                    }


                    else {

                        statusCell.fill = {

                            type: "pattern",

                            pattern: "solid",

                            fgColor: {
                                argb: "E7E6E6"
                            }

                        };

                    }


                    nomor++;

                });


            // =========================
            // FILTER
            // =========================

            const lastRow =
                worksheet.rowCount;


            worksheet.autoFilter = {

                from: `A${headerRow}`,

                to: `H${lastRow}`

            };


            // =========================
            // FREEZE HEADER
            // =========================

            worksheet.views = [

                {

                    state: "frozen",

                    ySplit: headerRow

                }

            ];


            // =========================
            // PRINT
            // =========================

            worksheet.pageSetup = {

                orientation: "landscape",

                paperSize: 9,

                fitToPage: true,

                fitToWidth: 1,

                fitToHeight: 0,

                margins: {

                    left: 0.25,

                    right: 0.25,

                    top: 0.5,

                    bottom: 0.5,

                    header: 0.2,

                    footer: 0.2

                }

            };


            worksheet.pageSetup.printArea =
                `A1:H${lastRow}`;


            // =========================
            // DOWNLOAD
            // =========================

            const buffer =
                await workbook.xlsx.writeBuffer();


            const blob =
                new Blob(
                    [buffer],
                    {
                        type:
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    }
                );


            const url =
                URL.createObjectURL(blob);


            const link =
                document.createElement("a");


            link.href = url;


            link.download =
                `Laporan_Absensi_${tanggalDipilih.replace(
                    /\//g,
                    "-"
                )}.xlsx`;


            document.body.appendChild(link);


            link.click();


            document.body.removeChild(link);


            URL.revokeObjectURL(url);


            btnDownload.disabled = false;

            btnDownload.textContent =
                "📥 Download Laporan";


        }

        catch (error) {

            console.error(
                "Gagal membuat Excel:",
                error
            );


            alert(
                "Gagal membuat laporan Excel.\n\n" +
                "Pastikan logo.png berada satu folder dengan index.html."
            );


            btnDownload.disabled = false;

            btnDownload.textContent =
                "📥 Download Laporan";

        }

    });
}
// =================================
// JAM DIGITAL REAL-TIME
// =================================

function updateJamDigital() {

    const sekarang = new Date();

    const jam = sekarang.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    const tanggal = sekarang.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    });

    const jamElement = document.getElementById("jamDigital");
    const tanggalElement = document.getElementById("tanggalDigital");

    if (jamElement) {
        jamElement.textContent = jam;
    }

    if (tanggalElement) {
        tanggalElement.textContent = tanggal;
    }
}

updateJamDigital();

setInterval(updateJamDigital, 1000);
// =================================
// RESET STATUS OTOMATIS
// =================================

function resetStatusOtomatis() {

    const status = document.getElementById("status");

    if (!status) return;

    status.innerHTML = `
        <div class="scan-ready">
            <div class="ready-icon">✓</div>
            <div class="ready-title">SIAP MENERIMA SCAN</div>
            <div class="ready-text">
                Silakan scan QR karyawan berikutnya
            </div>
        </div>
    `;

    status.className = "status";
}
// =================================
// LOGIN & PANEL ADMIN
// =================================

const btnAdmin = document.getElementById("btnAdmin");
const btnTutupAdmin = document.getElementById("btnTutupAdmin");
const panelAdmin = document.getElementById("panelAdmin");

const loginAdmin = document.getElementById("loginAdmin");
const passwordAdmin = document.getElementById("passwordAdmin");
const btnLoginAdmin = document.getElementById("btnLoginAdmin");
const btnBatalLogin = document.getElementById("btnBatalLogin");
const loginError = document.getElementById("loginError");

// PASSWORD ADMIN
const PASSWORD_ADMIN = "admin123";

// Klik tombol Admin
if (btnAdmin && loginAdmin) {

    btnAdmin.addEventListener("click", function() {

        loginAdmin.style.display = "flex";

        passwordAdmin.value = "";
        loginError.textContent = "";

        setTimeout(function() {
            passwordAdmin.focus();
        }, 100);

    });

}

// Tombol Login
if (btnLoginAdmin) {

    btnLoginAdmin.addEventListener("click", function() {

        const password = passwordAdmin.value;

        if (password === PASSWORD_ADMIN) {

            loginAdmin.style.display = "none";

            if (panelAdmin) {
                panelAdmin.style.display = "block";
            }

            passwordAdmin.value = "";
            loginError.textContent = "";

        } else {

            loginError.textContent = "Password admin salah.";

            passwordAdmin.value = "";
            passwordAdmin.focus();

        }

    });

}

// Tekan ENTER pada password
if (passwordAdmin) {

    passwordAdmin.addEventListener("keydown", function(event) {

        if (event.key === "Enter") {
            btnLoginAdmin.click();
        }

    });

}

// Tombol Batal
if (btnBatalLogin) {

    btnBatalLogin.addEventListener("click", function() {

        loginAdmin.style.display = "none";

        passwordAdmin.value = "";
        loginError.textContent = "";

    });

}

// Tutup Panel Admin
if (btnTutupAdmin && panelAdmin) {

    btnTutupAdmin.addEventListener("click", function() {

        panelAdmin.style.display = "none";

    });

}
// =================================
// DATA KARYAWAN ADMIN
// =================================

const btnDataKaryawan = document.getElementById("btnDataKaryawan");
const dataKaryawanPanel = document.getElementById("dataKaryawanPanel");
const btnTutupDataKaryawan = document.getElementById("btnTutupDataKaryawan");
const tabelDataKaryawan = document.getElementById("tabelDataKaryawan");

if (btnDataKaryawan && dataKaryawanPanel) {

    btnDataKaryawan.addEventListener("click", function() {

        dataKaryawanPanel.style.display = "block";

        tampilkanDataKaryawanAdmin();

    });

}

if (btnTutupDataKaryawan && dataKaryawanPanel) {

    btnTutupDataKaryawan.addEventListener("click", function() {

        dataKaryawanPanel.style.display = "none";

    });

}

function tampilkanDataKaryawanAdmin() {

    if (!tabelDataKaryawan) return;

    tabelDataKaryawan.innerHTML = "";

    const daftarID = Object.keys(dataKaryawan);

    if (daftarID.length === 0) {

        tabelDataKaryawan.innerHTML = `
            <tr>
                <td colspan="4">
                    Data karyawan belum tersedia.
                </td>
            </tr>
        `;

        return;
    }

    daftarID.forEach(function(id, index) {

        const karyawan = dataKaryawan[id];

        const row = document.createElement("tr");

        row.innerHTML = `
    <td>${index + 1}</td>
    <td><strong>${id}</strong></td>
    <td>${karyawan.nama}</td>
    <td>${karyawan.bagian}</td>
    <td>
        <button
            class="btn-edit-karyawan"
            onclick="editKaryawan('${id}')"
        >
            ✏️ Edit
        </button>
        <button
    class="btn-hapus-karyawan"
    onclick="hapusKaryawan('${id}')"
>
    🗑️ Hapus
</button>
    </td>
`;

        tabelDataKaryawan.appendChild(row);

    });

}

// =================================
// LAPORAN ABSENSI
// =================================

const btnLaporanAbsensi =
    document.getElementById("btnLaporanAbsensi");

const laporanAbsensiPanel =
    document.getElementById("laporanAbsensiPanel");

const btnTutupLaporan =
    document.getElementById("btnTutupLaporan");

const btnTampilkanLaporan =
    document.getElementById("btnTampilkanLaporan");

const filterLaporanTanggal =
    document.getElementById("filterLaporanTanggal");

const tabelLaporanAbsensi =
    document.getElementById("tabelLaporanAbsensi");


if (btnLaporanAbsensi && laporanAbsensiPanel) {

    btnLaporanAbsensi.addEventListener("click", function() {

        laporanAbsensiPanel.style.display = "block";

        const tanggalHariIni =
            new Date().toISOString().split("T")[0];

        filterLaporanTanggal.value =
            tanggalHariIni;

        tampilkanLaporanAbsensi();

    });

}


if (btnTutupLaporan && laporanAbsensiPanel) {

    btnTutupLaporan.addEventListener("click", function() {

        laporanAbsensiPanel.style.display = "none";

    });

}


if (btnTampilkanLaporan) {

    btnTampilkanLaporan.addEventListener(
        "click",
        function() {

            tampilkanLaporanAbsensi();

        }
    );

}


function tampilkanLaporanAbsensi() {

    if (!tabelLaporanAbsensi) return;

    const tanggal =
        filterLaporanTanggal.value;

    tabelLaporanAbsensi.innerHTML = "";

    const daftarID =
        Object.keys(dataKaryawan);

    if (daftarID.length === 0) {

        tabelLaporanAbsensi.innerHTML = `
            <tr>
                <td colspan="8">
                    Data karyawan belum tersedia.
                </td>
            </tr>
        `;

        return;
    }

    daftarID.forEach(function(id, index) {

        const karyawan =
            dataKaryawan[id];

        const absensiHariIni =
            dataAbsensi.filter(function(item) {

                let tanggalAbsensi =
                    String(item.tanggal || "").trim();

                // Konversi DD/MM/YYYY
                // menjadi YYYY-MM-DD
                if (tanggalAbsensi.includes("/")) {

                    const bagianTanggal =
                        tanggalAbsensi.split("/");

                    if (bagianTanggal.length === 3) {

                        tanggalAbsensi =
                            bagianTanggal[2] +
                            "-" +
                            bagianTanggal[1].padStart(2, "0") +
                            "-" +
                            bagianTanggal[0].padStart(2, "0");
                    }
                }

                return (
                    String(item.id).trim() ===
                    String(id).trim() &&
                    tanggalAbsensi === tanggal
                );

            });

        let jamMasuk = "";
        let jamPulang = "";

        if (absensiHariIni.length > 0) {

            const data =
                absensiHariIni[
                    absensiHariIni.length - 1
                ];

            jamMasuk =
                data.jamMasuk || "";

            jamPulang =
                data.jamPulang || "";
        }

        let status = "BELUM HADIR";

        if (jamMasuk && !jamPulang) {
            status = "BELUM PULANG";
        }

        if (jamMasuk && jamPulang) {
            status = "SUDAH PULANG";
        }

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${id}</strong></td>
            <td>${karyawan.nama}</td>
            <td>${karyawan.bagian}</td>
            <td>${tanggal}</td>
            <td>${jamMasuk || "-"}</td>
            <td>${jamPulang || "-"}</td>
            <td>${status}</td>
        `;

        tabelLaporanAbsensi.appendChild(row);

    });

}

// =================================
// EDIT KARYAWAN
// =================================

function editKaryawan(id) {

    const karyawan = dataKaryawan[id];

    if (!karyawan) {
        return;
    }

    const form = document.getElementById("formTambahKaryawan");

    const inputID = document.getElementById("inputIDKaryawan");
    const inputNama = document.getElementById("inputNamaKaryawan");
    const inputBagian = document.getElementById("inputBagianKaryawan");

    const idLama = document.getElementById("idKaryawanLama");

    const judul = document.getElementById("judulFormKaryawan");
    const deskripsi = document.getElementById("deskripsiFormKaryawan");

    const btnSimpan = document.getElementById("btnSimpanKaryawan");
    const btnUpdate = document.getElementById("btnUpdateKaryawan");

    form.style.display = "block";

    inputID.value = id;
inputID.disabled = true;

inputNama.value = karyawan.nama;
inputBagian.value = karyawan.bagian;

    idLama.value = id;

    judul.textContent = "✏️ Edit Karyawan";
    deskripsi.textContent = "Ubah data karyawan";

    btnSimpan.style.display = "none";
    btnUpdate.style.display = "inline-block";

    inputNama.focus();
}
// =================================
// HAPUS KARYAWAN
// =================================

function hapusKaryawan(id) {

    const karyawan = dataKaryawan[id];

    if (!karyawan) {
        return;
    }

    const yakin = confirm(
        "Apakah yakin ingin menghapus karyawan " +
        karyawan.nama +
        " (" + id + ")?\n\n" +
        "Data yang dihapus adalah data karyawan dari database."
    );

    if (!yakin) {
        return;
    }

    const callbackName =
        "deleteKaryawanCallback_" + Date.now();

    window[callbackName] = function(response) {

        console.log(
            "HASIL HAPUS KARYAWAN:",
            response
        );

        if (
            response &&
            response.status ===
            "KARYAWAN_BERHASIL_DIHAPUS"
        ) {

            alert(
                "✅ Karyawan berhasil dihapus."
            );

            setTimeout(function() {

                ambilDataKaryawan();

                tampilkanDataKaryawanAdmin();

                tampilkanAbsensi();

            }, 500);

        } else if (
            response &&
            response.status ===
            "KARYAWAN_TIDAK_DITEMUKAN"
        ) {

            alert(
                "⚠️ Karyawan tidak ditemukan."
            );

        } else {

            alert(
                "❌ Data karyawan gagal dihapus."
            );
        }

        delete window[callbackName];

        if (scriptRequest.parentNode) {
            scriptRequest.parentNode.removeChild(
                scriptRequest
            );
        }
    };

    const scriptRequest =
        document.createElement("script");

    scriptRequest.src =
        URL_GOOGLE_SHEETS +
        "?action=deleteKaryawan" +
        "&id=" +
        encodeURIComponent(id) +
        "&callback=" +
        callbackName;

    scriptRequest.onerror = function() {

        alert(
            "❌ Gagal menghubungi Google Sheets."
        );

        delete window[callbackName];

        if (scriptRequest.parentNode) {
            scriptRequest.parentNode.removeChild(
                scriptRequest
            );
        }
    };

    document.body.appendChild(scriptRequest);
}
// =================================
// FORM TAMBAH KARYAWAN
// =================================

const btnTambahKaryawan = document.getElementById("btnTambahKaryawan");
const btnBatalTambahKaryawan = document.getElementById("btnBatalTambahKaryawan");
const formTambahKaryawan = document.getElementById("formTambahKaryawan");

if (btnTambahKaryawan && formTambahKaryawan) {

    btnTambahKaryawan.addEventListener("click", function() {

        formTambahKaryawan.style.display = "block";

        document.getElementById("inputIDKaryawan").focus();

    });

}

if (btnBatalTambahKaryawan && formTambahKaryawan) {

    btnBatalTambahKaryawan.addEventListener("click", function() {

        formTambahKaryawan.style.display = "none";

        document.getElementById("inputIDKaryawan").value = "";
        document.getElementById("inputNamaKaryawan").value = "";
        document.getElementById("inputBagianKaryawan").value = "";

        document.getElementById("statusTambahKaryawan").textContent = "";

    });

}
// =================================
// SIMPAN KARYAWAN KE GOOGLE SHEETS
// =================================

const btnSimpanKaryawan = document.getElementById("btnSimpanKaryawan");

// =================================
// UPDATE KARYAWAN
// =================================

const btnUpdateKaryawan = document.getElementById("btnUpdateKaryawan");

if (btnUpdateKaryawan) {

    btnUpdateKaryawan.addEventListener("click", function() {

        const idLama = document.getElementById("idKaryawanLama").value.trim();
        const nama = document.getElementById("inputNamaKaryawan").value.trim();
        const bagian = document.getElementById("inputBagianKaryawan").value.trim();

        const statusTambah =
            document.getElementById("statusTambahKaryawan");

        if (!idLama || !nama || !bagian) {

            statusTambah.textContent =
                "⚠️ Semua data wajib diisi.";

            statusTambah.style.color = "#d92d20";

            return;
        }

        statusTambah.textContent =
            "⏳ Memperbarui data...";

        statusTambah.style.color = "#667085";

        const callbackName =
            "updateKaryawanCallback_" + Date.now();

        window[callbackName] = function(response) {

            console.log(
                "HASIL UPDATE KARYAWAN:",
                response
            );

            if (
                response &&
                response.status ===
                "KARYAWAN_BERHASIL_DIUPDATE"
            ) {

                statusTambah.textContent =
                    "✅ Data karyawan berhasil diperbarui.";

                statusTambah.style.color =
                    "#12b76a";

                setTimeout(function() {

                    ambilDataKaryawan();

                    tampilkanDataKaryawanAdmin();

                    formTambahKaryawan.style.display =
                        "none";

                }, 1000);

            } else {

                statusTambah.textContent =
                    "❌ Data gagal diperbarui.";

                statusTambah.style.color =
                    "#d92d20";
            }

            delete window[callbackName];

            if (scriptRequest.parentNode) {
                scriptRequest.parentNode.removeChild(
                    scriptRequest
                );
            }

        };

        const scriptRequest =
            document.createElement("script");

        scriptRequest.src =
            URL_GOOGLE_SHEETS +
            "?action=updateKaryawan" +
            "&id=" +
            encodeURIComponent(idLama) +
            "&nama=" +
            encodeURIComponent(nama) +
            "&bagian=" +
            encodeURIComponent(bagian) +
            "&callback=" +
            callbackName;

        scriptRequest.onerror = function() {

            statusTambah.textContent =
                "❌ Gagal menghubungi Google Sheets.";

            statusTambah.style.color =
                "#d92d20";

            delete window[callbackName];

            if (scriptRequest.parentNode) {
                scriptRequest.parentNode.removeChild(
                    scriptRequest
                );
            }

        };

        document.body.appendChild(scriptRequest);

    });

}

if (btnSimpanKaryawan) {

    btnSimpanKaryawan.addEventListener("click", function() {

        const id = document.getElementById("inputIDKaryawan").value.trim();
        const nama = document.getElementById("inputNamaKaryawan").value.trim();
        const bagian = document.getElementById("inputBagianKaryawan").value.trim();
        const statusTambah = document.getElementById("statusTambahKaryawan");

        // ==============================
        // VALIDASI
        // ==============================

        if (!id || !nama || !bagian) {

            statusTambah.textContent =
                "⚠️ Semua data wajib diisi.";

            statusTambah.style.color = "#d92d20";

            return;
        }

        // ==============================
        // CEK ID LOKAL
        // ==============================

        if (dataKaryawan[id]) {

            statusTambah.textContent =
                "⚠️ ID karyawan sudah terdaftar.";

            statusTambah.style.color = "#d92d20";

            return;
        }

        statusTambah.textContent =
            "⏳ Menyimpan data...";

        statusTambah.style.color = "#667085";

        // ==============================
        // CALLBACK JSONP
        // ==============================

        const callbackName =
            "tambahKaryawanCallback_" + Date.now();

        window[callbackName] = function(response) {

            console.log(
                "HASIL TAMBAH KARYAWAN:",
                response
            );

            if (
                response &&
                response.status ===
                "KARYAWAN_BERHASIL_DITAMBAHKAN"
            ) {

                statusTambah.textContent =
                    "✅ Karyawan berhasil ditambahkan.";

                statusTambah.style.color = "#12b76a";

                // Bersihkan form
                document.getElementById("inputIDKaryawan").value = "";
                document.getElementById("inputNamaKaryawan").value = "";
                document.getElementById("inputBagianKaryawan").value = "";

                // Ambil ulang data Google Sheets
                setTimeout(function() {

                    ambilDataKaryawan();

                    tampilkanDataKaryawanAdmin();

                }, 1000);

            } else if (
                response &&
                response.status ===
                "ID_KARYAWAN_SUDAH_ADA"
            ) {

                statusTambah.textContent =
                    "⚠️ ID karyawan sudah terdaftar.";

                statusTambah.style.color = "#d92d20";

            } else {

                statusTambah.textContent =
                    "❌ Data gagal disimpan.";

                statusTambah.style.color = "#d92d20";

            }

            // Hapus callback
            delete window[callbackName];

            if (scriptRequest.parentNode) {
                scriptRequest.parentNode.removeChild(scriptRequest);
            }

        };

        // ==============================
        // REQUEST KE APPS SCRIPT
        // ==============================

        const scriptRequest =
            document.createElement("script");

        scriptRequest.src =
            URL_GOOGLE_SHEETS +
            "?action=tambahKaryawan" +
            "&id=" + encodeURIComponent(id) +
            "&nama=" + encodeURIComponent(nama) +
            "&bagian=" + encodeURIComponent(bagian) +
            "&callback=" + callbackName;

        scriptRequest.onerror = function() {

            statusTambah.textContent =
                "❌ Gagal menghubungi Google Sheets.";

            statusTambah.style.color = "#d92d20";

            delete window[callbackName];

            if (scriptRequest.parentNode) {
                scriptRequest.parentNode.removeChild(scriptRequest);
            }

        };

        document.body.appendChild(scriptRequest);

    });

}
// =========================
// DOWNLOAD EXCEL DARI LAPORAN ABSENSI
// =========================

const btnDownloadLaporan =
    document.getElementById("btnDownloadLaporan");

if (btnDownloadLaporan) {

    btnDownloadLaporan.addEventListener("click", function () {

        const filterLaporanTanggal =
            document.getElementById("filterLaporanTanggal");

        const filterTanggal =
            document.getElementById("filterTanggal");

        if (
            filterLaporanTanggal &&
            filterLaporanTanggal.value &&
            filterTanggal
        ) {

            // Samakan tanggal laporan
            // dengan filter utama
            filterTanggal.value =
                filterLaporanTanggal.value;
        }

        // Jalankan fungsi Download Excel lama
        if (btnDownload) {
            btnDownload.click();
        }

    });

}
// =========================
// SINKRONISASI DATA
// =========================

const btnSinkronisasi =
    document.getElementById("btnSinkronisasi");

if (btnSinkronisasi) {

    btnSinkronisasi.addEventListener("click", function () {

        // Ubah tampilan tombol
        btnSinkronisasi.style.opacity = "0.6";
        btnSinkronisasi.style.pointerEvents = "none";

        const teksAsli =
            btnSinkronisasi.innerHTML;

        btnSinkronisasi.innerHTML = `
            <span>⏳</span>
            <div>
                <strong>Menyinkronkan...</strong>
                <small>Mengambil data terbaru</small>
            </div>
        `;

        // Ambil data terbaru dari Google Sheets
        ambilDataKaryawan();
        ambilDataAbsensi();

        // Tunggu proses pengambilan data selesai
        setTimeout(function () {

            tampilkanAbsensi();
            updateDashboard();

            if (
                typeof tampilkanDataKaryawanAdmin ===
                "function"
            ) {
                tampilkanDataKaryawanAdmin();
            }

            if (
                typeof tampilkanLaporanAbsensi ===
                "function"
            ) {
                tampilkanLaporanAbsensi();
            }

            btnSinkronisasi.innerHTML = `
    <span>✅</span>
    <div>
        <strong>Sinkronisasi Berhasil</strong>
        <small>
            ${Object.keys(dataKaryawan).length} karyawan •
            ${dataAbsensi.length} data absensi
        </small>
    </div>
`;

            setTimeout(function () {

                btnSinkronisasi.innerHTML =
                    teksAsli;

                btnSinkronisasi.style.opacity = "1";
                btnSinkronisasi.style.pointerEvents =
                    "auto";

            }, 1500);

        }, 1500);

    });

}
console.log("ExcelJS:", typeof ExcelJS);