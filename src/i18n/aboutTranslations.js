const en = {
  hero: {
    kicker: 'Game intelligence',
    title: 'Inside',
    titleHighlight: 'GTA VI',
    description: 'The confirmed launch facts, the scale behind Rockstar’s next open world, and a live encyclopedia overview in one place.',
    launchCard: 'Official launch countdown',
    contentCta: 'Explore the facts',
  },
  stats: {
    eyebrow: 'The numbers',
    title: 'Scale at a glance',
    description: 'Official values are marked separately from reporting, community reconstructions, and unverified production estimates.',
    official: 'Official',
    estimate: 'Estimate',
    items: {
      release: { label: 'Release date', note: 'Worldwide console launch' },
      price: { label: 'Pre-order price', note: 'Standard Edition in the US' },
      budget: { label: 'Reported budget', note: 'Rumored development and marketing range' },
      team: { label: 'Team size', note: 'Reported contributors across Rockstar studios' },
      map: { label: 'Estimated map', note: 'Fan reconstruction; Rockstar has not published an area' },
      regions: { label: 'Major regions', note: 'Named by Rockstar so far' },
    },
  },
  media: {
    eyebrow: 'Official media', title: 'Promo image vault',
    description: 'Browse official artwork, wallpapers, game screenshots, and Ultimate Edition benefits parsed from Rockstar’s GTA VI media library.',
    tabsLabel: 'Promo image collections',
    tabs: { artwork: 'Artwork & wallpapers', screenshots: 'Screenshots', ultimate: 'Ultimate Edition' },
    official: 'Rockstar Games', viewSource: 'View official source', openImage: 'Open image',
    showing: 'Showing', of: 'of', showMore: 'Show more',
    sourceNote: 'Titles and imagery are sourced from Rockstar Games.',
    fullSize: 'Open full size', close: 'Close gallery', previous: 'Previous image', next: 'Next image',
  },
  notice: 'Rockstar has not confirmed the project budget, contributor count, or map area. Those cards are estimates and may change.',
  sources: {
    label: 'Sources and context',
    official: 'Official preorder announcement',
    wikipedia: 'Wikipedia overview',
    map: 'Community map estimate',
  },
}

const zh = {
  hero: {
    kicker: '游戏情报', title: '深入了解', titleHighlight: 'GTA VI',
    description: '在一个页面查看已确认的发售信息、Rockstar 新开放世界的制作规模和实时百科概览。',
    launchCard: '官方发售倒计时',
    contentCta: '查看详情',
  },
  stats: {
    eyebrow: '关键数字', title: '规模一览',
    description: '官方数据与媒体报道、社区重建及未经证实的制作估算会分别标注。',
    official: '官方', estimate: '估算',
    items: {
      release: { label: '发售日期', note: '全球主机版发售' },
      price: { label: '预购价格', note: '美国标准版' },
      budget: { label: '传闻预算', note: '据传开发与营销费用区间' },
      team: { label: '团队规模', note: 'Rockstar 多个工作室的据报参与人数' },
      map: { label: '地图估算', note: '粉丝重建；Rockstar 尚未公布面积' },
      regions: { label: '主要地区', note: 'Rockstar 目前公布的地区' },
    },
  },
  media: {
    eyebrow: '官方媒体', title: '宣传图片库',
    description: '浏览从 Rockstar GTA VI 官方媒体库整理的原画、壁纸、游戏截图和终极版内容。',
    tabsLabel: '宣传图片分类',
    tabs: { artwork: '原画与壁纸', screenshots: '游戏截图', ultimate: '终极版' },
    official: 'Rockstar Games', viewSource: '查看官方来源', openImage: '打开图片',
    showing: '显示', of: '/', showMore: '显示更多',
    sourceNote: '标题和图片均来自 Rockstar Games。',
    fullSize: '打开原图', close: '关闭图库', previous: '上一张', next: '下一张',
  },
  notice: 'Rockstar 尚未确认项目预算、参与人数或地图面积。相关卡片均为估算，可能会变化。',
  sources: { label: '来源与背景', official: '官方预购公告', wikipedia: '维基百科概览', map: '社区地图估算' },
}

const ru = {
  hero: {
    kicker: 'Досье на игру', title: 'Внутри', titleHighlight: 'GTA VI',
    description: 'Подтверждённые данные о релизе, масштаб нового открытого мира Rockstar и живая энциклопедическая справка на одной странице.',
    launchCard: 'Официальный отсчёт до релиза',
    contentCta: 'Смотреть факты',
  },
  stats: {
    eyebrow: 'Ключевые цифры', title: 'Масштаб в цифрах',
    description: 'Официальные значения отделены от публикаций, реконструкций сообщества и неподтверждённых производственных оценок.',
    official: 'Официально', estimate: 'Оценка',
    items: {
      release: { label: 'Дата релиза', note: 'Мировой запуск на консолях' },
      price: { label: 'Цена предзаказа', note: 'Стандартное издание в США' },
      budget: { label: 'Предполагаемый бюджет', note: 'Слухи о затратах на разработку и маркетинг' },
      team: { label: 'Размер команды', note: 'Оценка числа участников из студий Rockstar' },
      map: { label: 'Размер карты', note: 'Фанатская реконструкция; официальной площади нет' },
      regions: { label: 'Крупные регионы', note: 'Названы Rockstar на данный момент' },
    },
  },
  media: {
    eyebrow: 'Официальные материалы', title: 'Промо-галерея',
    description: 'Официальные арты, обои, игровые скриншоты и материалы Ultimate Edition из медиатеки GTA VI от Rockstar.',
    tabsLabel: 'Коллекции промоизображений',
    tabs: { artwork: 'Арты и обои', screenshots: 'Скриншоты', ultimate: 'Ultimate Edition' },
    official: 'Rockstar Games', viewSource: 'Открыть источник', openImage: 'Открыть изображение',
    showing: 'Показано', of: 'из', showMore: 'Показать ещё',
    sourceNote: 'Названия и изображения предоставлены Rockstar Games.',
    fullSize: 'Открыть оригинал', close: 'Закрыть галерею', previous: 'Предыдущее изображение', next: 'Следующее изображение',
  },
  notice: 'Rockstar не подтверждала бюджет проекта, число участников или площадь карты. Эти карточки содержат оценки и могут измениться.',
  sources: { label: 'Источники и контекст', official: 'Официальный анонс предзаказа', wikipedia: 'Обзор в Википедии', map: 'Оценка карты сообществом' },
}

const it = {
  hero: {
    kicker: 'Dossier sul gioco', title: 'Dentro', titleHighlight: 'GTA VI',
    description: 'I dati confermati sul lancio, la scala del prossimo mondo aperto di Rockstar e una panoramica enciclopedica aggiornata.',
    launchCard: 'Conto alla rovescia ufficiale',
    contentCta: 'Esplora i dati',
  },
  stats: {
    eyebrow: 'I numeri', title: "La scala in un'occhiata",
    description: 'I valori ufficiali sono distinti da notizie, ricostruzioni della community e stime di produzione non verificate.',
    official: 'Ufficiale', estimate: 'Stima',
    items: {
      release: { label: 'Data di uscita', note: 'Lancio mondiale su console' },
      price: { label: 'Prezzo preordine', note: 'Edizione Standard negli USA' },
      budget: { label: 'Budget riportato', note: 'Intervallo ipotizzato per sviluppo e marketing' },
      team: { label: 'Dimensione del team', note: 'Contributori stimati negli studi Rockstar' },
      map: { label: 'Mappa stimata', note: "Ricostruzione dei fan; l'area non è ufficiale" },
      regions: { label: 'Regioni principali', note: 'Finora nominate da Rockstar' },
    },
  },
  media: {
    eyebrow: 'Media ufficiali', title: 'Archivio promozionale',
    description: 'Sfoglia artwork, sfondi, screenshot e contenuti della Ultimate Edition tratti dalla libreria media ufficiale di GTA VI.',
    tabsLabel: 'Raccolte di immagini promozionali',
    tabs: { artwork: 'Artwork e sfondi', screenshots: 'Screenshot', ultimate: 'Ultimate Edition' },
    official: 'Rockstar Games', viewSource: 'Vedi fonte ufficiale', openImage: 'Apri immagine',
    showing: 'Visualizzati', of: 'di', showMore: 'Mostra altro',
    sourceNote: 'Titoli e immagini provengono da Rockstar Games.',
    fullSize: 'Apri a dimensione intera', close: 'Chiudi galleria', previous: 'Immagine precedente', next: 'Immagine successiva',
  },
  notice: 'Rockstar non ha confermato budget, numero di collaboratori o area della mappa. Queste schede sono stime soggette a variazioni.',
  sources: { label: 'Fonti e contesto', official: 'Annuncio ufficiale dei preordini', wikipedia: 'Panoramica Wikipedia', map: 'Stima della mappa della community' },
}

const id = {
  hero: {
    kicker: 'Intel game', title: 'Mengenal', titleHighlight: 'GTA VI',
    description: 'Fakta peluncuran terkonfirmasi, skala dunia terbuka terbaru Rockstar, dan ringkasan ensiklopedia langsung dalam satu halaman.',
    launchCard: 'Hitung mundur peluncuran resmi',
    contentCta: 'Jelajahi fakta',
  },
  stats: {
    eyebrow: 'Angka penting', title: 'Skala sekilas',
    description: 'Nilai resmi dipisahkan dari laporan, rekonstruksi komunitas, dan perkiraan produksi yang belum diverifikasi.',
    official: 'Resmi', estimate: 'Perkiraan',
    items: {
      release: { label: 'Tanggal rilis', note: 'Peluncuran konsol global' },
      price: { label: 'Harga pre-order', note: 'Edisi Standar di AS' },
      budget: { label: 'Anggaran dilaporkan', note: 'Rumor rentang biaya pengembangan dan pemasaran' },
      team: { label: 'Ukuran tim', note: 'Perkiraan kontributor di berbagai studio Rockstar' },
      map: { label: 'Perkiraan peta', note: 'Rekonstruksi penggemar; luas belum diumumkan' },
      regions: { label: 'Wilayah utama', note: 'Dinamai Rockstar sejauh ini' },
    },
  },
  media: {
    eyebrow: 'Media resmi', title: 'Galeri gambar promo',
    description: 'Jelajahi artwork, wallpaper, screenshot game, dan konten Ultimate Edition dari pustaka media resmi GTA VI milik Rockstar.',
    tabsLabel: 'Koleksi gambar promosi',
    tabs: { artwork: 'Artwork & wallpaper', screenshots: 'Screenshot', ultimate: 'Ultimate Edition' },
    official: 'Rockstar Games', viewSource: 'Lihat sumber resmi', openImage: 'Buka gambar',
    showing: 'Menampilkan', of: 'dari', showMore: 'Tampilkan lainnya',
    sourceNote: 'Judul dan gambar bersumber dari Rockstar Games.',
    fullSize: 'Buka ukuran penuh', close: 'Tutup galeri', previous: 'Gambar sebelumnya', next: 'Gambar berikutnya',
  },
  notice: 'Rockstar belum mengonfirmasi anggaran, jumlah kontributor, atau luas peta. Kartu tersebut adalah perkiraan dan dapat berubah.',
  sources: { label: 'Sumber dan konteks', official: 'Pengumuman pre-order resmi', wikipedia: 'Ringkasan Wikipedia', map: 'Perkiraan peta komunitas' },
}

const pl = {
  hero: {
    kicker: 'Informacje o grze', title: 'Wewnątrz', titleHighlight: 'GTA VI',
    description: 'Potwierdzone dane o premierze, skala kolejnego otwartego świata Rockstar i aktualny opis encyklopedyczny w jednym miejscu.',
    launchCard: 'Oficjalne odliczanie do premiery',
    contentCta: 'Zobacz fakty',
  },
  stats: {
    eyebrow: 'Najważniejsze liczby', title: 'Skala w skrócie',
    description: 'Wartości oficjalne są oddzielone od doniesień, rekonstrukcji społeczności i niepotwierdzonych szacunków produkcji.',
    official: 'Oficjalne', estimate: 'Szacunek',
    items: {
      release: { label: 'Data premiery', note: 'Światowa premiera konsolowa' },
      price: { label: 'Cena przedsprzedaży', note: 'Edycja Standard w USA' },
      budget: { label: 'Podawany budżet', note: 'Plotki o kosztach produkcji i marketingu' },
      team: { label: 'Wielkość zespołu', note: 'Szacowani współtwórcy w studiach Rockstar' },
      map: { label: 'Szacowana mapa', note: 'Rekonstrukcja fanów; brak oficjalnej powierzchni' },
      regions: { label: 'Główne regiony', note: 'Dotąd nazwane przez Rockstar' },
    },
  },
  media: {
    eyebrow: 'Oficjalne materiały', title: 'Galeria promocyjna',
    description: 'Przeglądaj oficjalne grafiki, tapety, zrzuty z gry i materiały Ultimate Edition z biblioteki GTA VI Rockstar.',
    tabsLabel: 'Kolekcje obrazów promocyjnych',
    tabs: { artwork: 'Grafiki i tapety', screenshots: 'Zrzuty ekranu', ultimate: 'Ultimate Edition' },
    official: 'Rockstar Games', viewSource: 'Zobacz oficjalne źródło', openImage: 'Otwórz obraz',
    showing: 'Wyświetlono', of: 'z', showMore: 'Pokaż więcej',
    sourceNote: 'Tytuły i obrazy pochodzą od Rockstar Games.',
    fullSize: 'Otwórz pełny rozmiar', close: 'Zamknij galerię', previous: 'Poprzedni obraz', next: 'Następny obraz',
  },
  notice: 'Rockstar nie potwierdziło budżetu, liczby współtwórców ani powierzchni mapy. Te karty są szacunkami i mogą się zmienić.',
  sources: { label: 'Źródła i kontekst', official: 'Oficjalna zapowiedź przedsprzedaży', wikipedia: 'Opis w Wikipedii', map: 'Szacunek mapy społeczności' },
}

const hi = {
  hero: {
    kicker: 'गेम इंटेलिजेंस', title: 'अंदर की कहानी', titleHighlight: 'GTA VI',
    description: 'पुष्ट लॉन्च जानकारी, Rockstar की अगली खुली दुनिया का पैमाना और लाइव विश्वकोश परिचय—सब एक जगह।',
    launchCard: 'आधिकारिक लॉन्च काउंटडाउन',
    contentCta: 'तथ्य देखें',
  },
  stats: {
    eyebrow: 'मुख्य आँकड़े', title: 'एक नज़र में पैमाना',
    description: 'आधिकारिक आँकड़ों को रिपोर्ट, समुदाय की पुनर्रचनाओं और अपुष्ट उत्पादन अनुमानों से अलग दिखाया गया है।',
    official: 'आधिकारिक', estimate: 'अनुमान',
    items: {
      release: { label: 'रिलीज़ तिथि', note: 'दुनिया भर में कंसोल लॉन्च' },
      price: { label: 'प्री-ऑर्डर कीमत', note: 'अमेरिका में स्टैंडर्ड एडिशन' },
      budget: { label: 'रिपोर्टेड बजट', note: 'विकास और मार्केटिंग लागत की अफ़वाह' },
      team: { label: 'टीम का आकार', note: 'Rockstar स्टूडियो में अनुमानित योगदानकर्ता' },
      map: { label: 'अनुमानित नक्शा', note: 'फ़ैन पुनर्रचना; आधिकारिक क्षेत्रफल उपलब्ध नहीं' },
      regions: { label: 'प्रमुख क्षेत्र', note: 'Rockstar द्वारा अब तक बताए गए' },
    },
  },
  media: {
    eyebrow: 'आधिकारिक मीडिया', title: 'प्रोमो इमेज गैलरी',
    description: 'Rockstar की आधिकारिक GTA VI मीडिया लाइब्रेरी से आर्टवर्क, वॉलपेपर, गेम स्क्रीनशॉट और Ultimate Edition सामग्री देखें।',
    tabsLabel: 'प्रोमो इमेज संग्रह',
    tabs: { artwork: 'आर्टवर्क और वॉलपेपर', screenshots: 'स्क्रीनशॉट', ultimate: 'Ultimate Edition' },
    official: 'Rockstar Games', viewSource: 'आधिकारिक स्रोत देखें', openImage: 'चित्र खोलें',
    showing: 'दिखाए गए', of: 'में से', showMore: 'और दिखाएँ',
    sourceNote: 'शीर्षक और चित्र Rockstar Games से लिए गए हैं।',
    fullSize: 'पूरा आकार खोलें', close: 'गैलरी बंद करें', previous: 'पिछला चित्र', next: 'अगला चित्र',
  },
  notice: 'Rockstar ने बजट, योगदानकर्ताओं की संख्या या नक्शे का क्षेत्रफल पुष्ट नहीं किया है। ये अनुमान बदल सकते हैं।',
  sources: { label: 'स्रोत और संदर्भ', official: 'आधिकारिक प्री-ऑर्डर घोषणा', wikipedia: 'Wikipedia परिचय', map: 'समुदाय का नक्शा अनुमान' },
}

const ms = {
  hero: {
    kicker: 'Maklumat permainan', title: 'Di sebalik', titleHighlight: 'GTA VI',
    description: 'Fakta pelancaran yang disahkan, skala dunia terbuka baharu Rockstar dan ringkasan ensiklopedia langsung dalam satu halaman.',
    launchCard: 'Kiraan detik pelancaran rasmi',
    contentCta: 'Terokai fakta',
  },
  stats: {
    eyebrow: 'Angka utama', title: 'Skala sepintas lalu',
    description: 'Nilai rasmi diasingkan daripada laporan, binaan semula komuniti dan anggaran produksi yang belum disahkan.',
    official: 'Rasmi', estimate: 'Anggaran',
    items: {
      release: { label: 'Tarikh keluaran', note: 'Pelancaran konsol sedunia' },
      price: { label: 'Harga prapesan', note: 'Edisi Standard di AS' },
      budget: { label: 'Bajet dilaporkan', note: 'Julat khabar angin pembangunan dan pemasaran' },
      team: { label: 'Saiz pasukan', note: 'Anggaran penyumbang merentas studio Rockstar' },
      map: { label: 'Anggaran peta', note: 'Binaan semula peminat; keluasan belum rasmi' },
      regions: { label: 'Wilayah utama', note: 'Dinamakan Rockstar setakat ini' },
    },
  },
  media: {
    eyebrow: 'Media rasmi', title: 'Galeri imej promosi',
    description: 'Terokai karya seni, kertas dinding, tangkapan skrin dan kandungan Ultimate Edition daripada pustaka media rasmi GTA VI Rockstar.',
    tabsLabel: 'Koleksi imej promosi',
    tabs: { artwork: 'Karya seni & kertas dinding', screenshots: 'Tangkapan skrin', ultimate: 'Ultimate Edition' },
    official: 'Rockstar Games', viewSource: 'Lihat sumber rasmi', openImage: 'Buka imej',
    showing: 'Dipaparkan', of: 'daripada', showMore: 'Tunjukkan lagi',
    sourceNote: 'Tajuk dan imej bersumber daripada Rockstar Games.',
    fullSize: 'Buka saiz penuh', close: 'Tutup galeri', previous: 'Imej sebelumnya', next: 'Imej seterusnya',
  },
  notice: 'Rockstar belum mengesahkan bajet, jumlah penyumbang atau keluasan peta. Kad ini ialah anggaran dan boleh berubah.',
  sources: { label: 'Sumber dan konteks', official: 'Pengumuman prapesan rasmi', wikipedia: 'Ringkasan Wikipedia', map: 'Anggaran peta komuniti' },
}

export const aboutTranslations = { en, zh, ru, it, id, pl, hi, ms }
