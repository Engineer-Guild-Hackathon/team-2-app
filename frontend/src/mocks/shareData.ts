import { ShareResponse, TokenStatus } from '../types/share';

export const mockShareData: Record<string, ShareResponse> = {
  'abc123': {
    child_public: {
      grade: '小1',
      initial: 'Tくん'
    },
    interest_summary: [
      {
        topic: '昆虫観察',
        score: 0.92,
        confidence: 3
      },
      {
        topic: '絵画',
        score: 0.81,
        confidence: 2
      },
      {
        topic: 'ブロック工作',
        score: 0.74,
        confidence: 2
      }
    ],
    artifacts: [
      {
        id: 'a1',
        type: 'photo',
        thumb_url: 'https://picsum.photos/400/300?random=1',
        caption: '夏の昆虫観察',
        date: '2025-09-01',
        tags: ['昆虫', '自然観察', '夏休み']
      },
      {
        id: 'a2',
        type: 'photo',
        thumb_url: 'https://picsum.photos/400/300?random=2',
        caption: 'カブトムシの絵',
        date: '2025-08-28',
        tags: ['絵画', '昆虫', 'カブトムシ']
      },
      {
        id: 'a3',
        type: 'text',
        caption: '観察日記：アリの巣について',
        date: '2025-08-25',
        tags: ['日記', '観察', 'アリ']
      },
      {
        id: 'a4',
        type: 'photo',
        thumb_url: 'https://picsum.photos/400/300?random=3',
        caption: 'レゴで作った昆虫の家',
        date: '2025-08-20',
        tags: ['ブロック', '工作', '昆虫']
      },
      {
        id: 'a5',
        type: 'video',
        caption: 'バッタの動きを観察した動画',
        date: '2025-08-15',
        tags: ['動画', '観察', 'バッタ']
      },
      {
        id: 'a6',
        type: 'audio',
        caption: '虫の鳴き声の録音',
        date: '2025-08-10',
        tags: ['音声', '自然音', '虫']
      }
    ],
    token_status: 'active' as TokenStatus
  },
  'expired123': {
    child_public: {
      grade: '小2',
      initial: 'Mちゃん'
    },
    interest_summary: [],
    artifacts: [],
    token_status: 'expired' as TokenStatus
  }
};

export const getShareData = (token: string): ShareResponse | null => {
  return mockShareData[token] || null;
};