import { Recommendation, RecommendationDetail } from '../types/recommendation';

export const mockRecommendations: Recommendation[] = [
  {
    id: 'park-001',
    kind: 'place',
    title: '代々木公園',
    subtitle: '都心のオアシス、広い芝生とピクニックエリア',
    thumbnail: '/images/yoyogi-park.jpg',
    distanceKm: 0.8,
    tags: ['ピクニック', '散歩', '自然'],
    score: 4.5,
    accessibility: ['ベビーカー可', '車椅子可', 'トイレ完備'],
    price: 'free',
    openHours: '5:00-20:00',
    badges: ['屋外', '雨OK一部', '学習向け']
  },
  {
    id: 'museum-001',
    kind: 'place',
    title: '国立科学博物館',
    subtitle: '恐竜から宇宙まで、子供の好奇心を刺激',
    thumbnail: '/images/science-museum.jpg',
    distanceKm: 1.2,
    tags: ['科学', '恐竜', '体験学習'],
    score: 4.7,
    accessibility: ['ベビーカー可', '車椅子可', '静かなエリア有', 'エレベーター完備'],
    price: '¥630',
    openHours: '9:00-17:00',
    badges: ['屋内', '雨OK', '学習向け', '体験型']
  },
  {
    id: 'library-001',
    kind: 'place',
    title: '中央図書館 こども室',
    subtitle: '豊富な児童書と読み聞かせイベント',
    thumbnail: '/images/central-library.jpg',
    distanceKm: 0.5,
    tags: ['読書', '静か', '学習'],
    score: 4.3,
    accessibility: ['ベビーカー可', '静かなエリア有', '授乳室有'],
    price: 'free',
    openHours: '9:00-20:00',
    badges: ['屋内', '雨OK', '学習向け', '静か']
  },
  {
    id: 'book-001',
    kind: 'book',
    title: 'はらぺこあおむし',
    subtitle: 'エリック・カール',
    thumbnail: '/images/hungry-caterpillar.jpg',
    tags: ['絵本', '色彩', '成長'],
    score: 4.8,
    accessibility: ['大きな文字', 'カラフル', '読み聞かせ向け'],
    price: '¥1,200',
    badges: ['2-5歳向け', '人気作品', 'ロングセラー']
  },
  {
    id: 'event-001',
    kind: 'event',
    title: '科学実験ワークショップ',
    subtitle: '親子で楽しむ簡単実験',
    thumbnail: '/images/science-workshop.jpg',
    distanceKm: 1.5,
    tags: ['実験', '親子', 'STEM'],
    score: 4.6,
    accessibility: ['親同伴', '手洗い場有', '安全管理'],
    price: '¥500',
    openHours: '14:00-16:00',
    badges: ['体験型', '学習向け', '親子参加']
  },
  {
    id: 'park-002',
    kind: 'place',
    title: '井の頭恩賜公園',
    subtitle: 'ボート遊びと動物園が楽しめる',
    thumbnail: '/images/inokashira-park.jpg',
    distanceKm: 2.1,
    tags: ['ボート', '動物園', '池'],
    score: 4.4,
    accessibility: ['ベビーカー可', 'トイレ完備'],
    price: 'free (動物園別料金)',
    openHours: '常時開放',
    badges: ['屋外', '動物', 'アクティブ']
  },
  {
    id: 'museum-002',
    kind: 'place',
    title: '子供の城',
    subtitle: '体験型展示で遊びながら学習',
    thumbnail: '/images/childrens-castle.jpg',
    distanceKm: 3.2,
    tags: ['体験', 'アート', 'クラフト'],
    score: 4.5,
    accessibility: ['ベビーカー可', '年齢別エリア', '授乳室有'],
    price: '¥500',
    openHours: '10:00-17:30',
    badges: ['屋内', '雨OK', '体験型', '創作活動']
  },
  {
    id: 'library-002',
    kind: 'place',
    title: '地域コミュニティ図書館',
    subtitle: '地域密着型、アットホームな雰囲気',
    thumbnail: '/images/community-library.jpg',
    distanceKm: 0.3,
    tags: ['地域', 'コミュニティ', 'イベント'],
    score: 4.2,
    accessibility: ['アクセス良好', 'バリアフリー'],
    price: 'free',
    openHours: '10:00-18:00',
    badges: ['屋内', '雨OK', '地域密着']
  },
  {
    id: 'book-002',
    kind: 'book',
    title: 'ぐりとぐら',
    subtitle: '中川李枝子・大村百合子',
    thumbnail: '/images/guri-gura.jpg',
    tags: ['友情', 'お料理', '冒険'],
    score: 4.7,
    accessibility: ['読み聞かせ向け', 'シリーズ作品'],
    price: '¥990',
    badges: ['3-6歳向け', '名作', 'シリーズ']
  },
  {
    id: 'event-002',
    kind: 'event',
    title: '自然観察会',
    subtitle: '公園で昆虫や植物を観察しよう',
    thumbnail: '/images/nature-observation.jpg',
    distanceKm: 1.8,
    tags: ['自然', '昆虫', '植物'],
    score: 4.3,
    accessibility: ['野外活動', '歩きやすい服装推奨'],
    price: '¥300',
    openHours: '9:00-11:00',
    badges: ['屋外', '学習向け', '季節限定']
  }
];

export const mockRecommendationDetails: Record<string, RecommendationDetail> = {
  'park-001': {
    id: 'park-001',
    kind: 'place',
    title: '代々木公園',
    description: '都心にありながら広大な緑地を誇る代々木公園。春には桜、秋には紅葉が美しく、四季を通じて自然を感じることができます。広い芝生エリアではピクニックやボール遊びを楽しめ、サイクリングロードでは自転車の練習も可能です。',
    gallery: [
      '/images/yoyogi-park-01.jpg',
      '/images/yoyogi-park-02.jpg',
      '/images/yoyogi-park-03.jpg'
    ],
    location: {
      lat: 35.6719,
      lng: 139.6965,
      address: '東京都渋谷区代々木神園町2-1',
      access: 'JR山手線「原宿駅」徒歩3分、東京メトロ千代田線「代々木公園駅」徒歩3分'
    },
    links: [
      { label: '公式サイト', url: 'https://www.tokyo-park.or.jp/park/format/index039.html' },
      { label: 'アクセス情報', url: 'https://www.tokyo-park.or.jp/park/format/access039.html' }
    ],
    suggestedActivities: [
      'ピクニックマットを持参して芝生でお弁当',
      '季節の花や木の観察とスケッチ',
      'フリスビーやボール遊び',
      '写真撮影（特に桜や紅葉の季節）',
      'サイクリングロードでの自転車練習'
    ],
    relatedBooks: ['book-003', 'book-004'],
    relatedPlaces: ['park-002', 'museum-001'],
    openingCalendar: ['2024-01-01T05:00:00Z', '2024-12-31T20:00:00Z']
  },
  'museum-001': {
    id: 'museum-001',
    kind: 'place',
    title: '国立科学博物館',
    description: '日本で最も歴史のある博物館の一つ。恐竜の骨格標本から最新の科学技術まで、幅広い展示で子供たちの知的好奇心を刺激します。体験型展示も豊富で、見るだけでなく触れて学ぶことができます。',
    gallery: [
      '/images/science-museum-01.jpg',
      '/images/science-museum-02.jpg',
      '/images/science-museum-03.jpg'
    ],
    location: {
      lat: 35.7167,
      lng: 139.7766,
      address: '東京都台東区上野公園7-20',
      access: 'JR上野駅「公園口」徒歩5分'
    },
    links: [
      { label: '公式サイト', url: 'https://www.kahaku.go.jp/' },
      { label: '展示案内', url: 'https://www.kahaku.go.jp/exhibitions/' }
    ],
    suggestedActivities: [
      '恐竜の骨格を見て、大きさを体感',
      'プラネタリウムで宇宙について学習',
      '鉱物展示でキラキラした石を観察',
      '科学実験ショーの参加',
      'スタンプラリーでミュージアムツアー'
    ],
    relatedBooks: ['book-005', 'book-006'],
    relatedPlaces: ['park-001', 'library-001'],
    openingCalendar: ['2024-01-02T09:00:00Z', '2024-12-28T17:00:00Z']
  }
};