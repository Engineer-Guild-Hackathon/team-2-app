export const ja = {
  // Common
  common: {
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    retry: '再試行',
    cancel: 'キャンセル',
    confirm: '確認',
    close: '閉じる',
    save: '保存',
    search: '検索',
    filter: 'フィルタ',
    sort: '並び替え',
    map: 'マップ',
    list: 'リスト',
    detail: '詳細',
    back: '戻る',
    next: '次へ',
    previous: '前へ',
    free: '無料',
    paid: '有料'
  },

  // Navigation
  nav: {
    home: 'ホーム',
    recommendations: 'おすすめ',
    profile: 'プロフィール',
    settings: '設定'
  },

  // Recommendation Page
  recommendations: {
    title: 'おすすめスポット',
    subtitle: 'あなたにぴったりの場所を見つけよう',
    todaysRecommendations: '今日のおすすめ',
    nearbyRecommendations: '近くのおすすめ',
    categories: {
      all: 'すべて',
      park: '公園',
      museum: '博物館',
      library: '図書館',
      book: '本',
      event: 'イベント'
    },
    modes: {
      learner: '学習者モード',
      family: '家庭モード'
    },
    distance: '距離',
    distanceUnit: 'km',
    openNow: '開館中',
    accessibility: 'アクセシビリティ',
    price: '料金',
    rating: '評価'
  },

  // Location
  location: {
    requestPermission: '位置情報の使用を許可',
    permissionTitle: '位置情報の利用について',
    permissionMessage: 'より良いおすすめを提供するため、位置情報の使用を許可してください。',
    permissionDenied: '位置情報の使用が拒否されました',
    permissionDeniedMessage: '手動で場所を設定することもできます。',
    currentLocation: '現在地',
    manualLocation: '手動で場所を設定',
    searchLocation: '場所を検索',
    useCurrentLocation: '現在地を使用',
    locationError: '位置情報を取得できませんでした',
    locationUnavailable: '位置情報サービスが利用できません'
  },

  // Filters
  filters: {
    title: 'フィルタ',
    distance: {
      title: '距離',
      within1km: '1km以内',
      within3km: '3km以内',
      within5km: '5km以内',
      within10km: '10km以内'
    },
    category: {
      title: 'カテゴリ'
    },
    price: {
      title: '料金',
      free: '無料のみ',
      paid: '有料込み'
    },
    openHours: {
      title: '営業時間',
      openNow: '現在営業中',
      openToday: '本日営業'
    },
    accessibility: {
      title: 'アクセシビリティ',
      strollerFriendly: 'ベビーカー可',
      wheelchairAccessible: '車椅子可',
      quietArea: '静かなエリア有',
      nurseryRoom: '授乳室有'
    },
    environment: {
      title: '環境',
      indoor: '屋内',
      outdoor: '屋外',
      rainOk: '雨天OK'
    },
    clearAll: 'すべてクリア',
    apply: '適用'
  },

  // Sort
  sort: {
    title: '並び替え',
    relevance: '関連度',
    distance: '距離',
    rating: '評価',
    newest: '新着',
    popular: '人気'
  },

  // Detail Page
  detail: {
    description: '説明',
    location: '場所',
    openHours: '営業時間',
    access: 'アクセス',
    price: '料金',
    accessibility: 'アクセシビリティ',
    suggestedActivities: 'おすすめの活動',
    relatedItems: '関連アイテム',
    relatedBooks: '関連する本',
    relatedPlaces: '関連する場所',
    openingCalendar: '営業カレンダー',
    directions: '道順',
    call: '電話',
    website: 'ウェブサイト',
    gallery: 'ギャラリー'
  },

  // Family Mode
  family: {
    mode: '家庭モード',
    parentTips: '保護者向けヒント',
    conversationStarters: '会話のきっかけ',
    safetyNotes: '安全に関する注意',
    whatToBring: '持ち物',
    ageAppropriate: '年齢に適した活動',
    learningOpportunities: '学習の機会'
  },

  // Empty States
  empty: {
    noResults: '結果が見つかりませんでした',
    noResultsMessage: '検索条件を変更してもう一度お試しください',
    noLocation: '位置情報が設定されていません',
    noLocationMessage: '位置情報を設定すると、近くのおすすめが表示されます',
    noRecommendations: 'おすすめがありません',
    noRecommendationsMessage: '条件に合うおすすめが見つかりませんでした'
  },

  // Error States
  error: {
    general: 'エラーが発生しました',
    network: 'ネットワークエラー',
    networkMessage: 'インターネット接続を確認してください',
    notFound: '見つかりませんでした',
    notFoundMessage: 'お探しの項目は見つかりませんでした',
    server: 'サーバーエラー',
    serverMessage: 'しばらく時間をおいてから再試行してください',
    location: '位置情報エラー',
    locationMessage: '位置情報を取得できませんでした'
  },

  // Accessibility
  a11y: {
    skipToContent: 'コンテンツへスキップ',
    menu: 'メニュー',
    closeMenu: 'メニューを閉じる',
    openMenu: 'メニューを開く',
    searchButton: '検索ボタン',
    filterButton: 'フィルタボタン',
    sortButton: '並び替えボタン',
    mapButton: 'マップボタン',
    listButton: 'リストボタン',
    locationButton: '位置情報ボタン',
    backButton: '戻るボタン',
    closeButton: '閉じるボタン',
    imageAlt: '画像',
    recommendationCard: 'おすすめカード',
    filterModal: 'フィルタモーダル',
    detailModal: '詳細モーダル'
  }
} as const;