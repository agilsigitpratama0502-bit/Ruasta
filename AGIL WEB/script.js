// ==========================================
// 1. FITUR TOGGLE DARK MODE
// ==========================================
const themeToggleBtn = document.getElementById('theme-toggle');

// Cek apakah user pernah memilih mode sebelumnya (disimpan di LocalStorage)
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️ Light Mode';
}

themeToggleBtn.addEventListener('click', () => {
    // Switch class 'dark-mode' pada tag <body>
    document.body.classList.toggle('dark-mode');
    
    // Cek status mode sekarang
    let theme = 'light';
    if (document.body.classList.contains('dark-mode')) {
        theme = 'dark';
        themeToggleBtn.textContent = '☀️ Light Mode';
    } else {
        themeToggleBtn.textContent = '🌙 Dark Mode';
    }
    
    // Simpan pilihan user di browser agar tidak hilang saat di-refresh
    localStorage.setItem('theme', theme);
});


// ==========================================
// 2. FITUR PENCARIAN ARTIKEL REAL-TIME
// ==========================================
const searchInput = document.getElementById('search-input');
const articles = document.querySelectorAll('.card');

searchInput.addEventListener('keyup', (e) => {
    const keyword = e.target.value.toLowerCase();

    articles.forEach((article) => {
        // Ambil teks judul artikel
        const title = article.querySelector('h2').textContent.toLowerCase();
        
        // Cek apakah judul mengandung kata kunci
        if (title.includes(keyword)) {
            article.style.display = 'block'; // Tampilkan artikel
        } else {
            article.style.display = 'none';  // Sembunyikan artikel
        }
    });
});