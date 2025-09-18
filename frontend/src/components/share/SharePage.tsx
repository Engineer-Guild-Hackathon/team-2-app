import { useState, useEffect } from 'react';
import { ShareResponse, ShareError, Artifact } from '../../types/share';
import { ShareService } from '../../services/shareService';
import { InterestCard } from './InterestCard';
import { ArtifactGrid } from './ArtifactGrid';
import { ArtifactModal } from './ArtifactModal';
import { StatusBanner } from './StatusBanner';
import { ErrorPage } from './ErrorPage';
import LoadingSpinner from '../ui/LoadingSpinner';

interface SharePageProps {
  token: string;
}

export function SharePage({ token }: SharePageProps) {
  const [data, setData] = useState<ShareResponse | null>(null);
  const [error, setError] = useState<ShareError | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const loadShareData = async () => {
      setLoading(true);
      try {
        const result = await ShareService.resolveShare(token);

        if ('error' in result) {
          setError(result);
        } else {
          setData(result);
        }
      } catch {
        setError({
          error: 'unknown_error',
          code: 500,
          message: '予期しないエラーが発生しました'
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadShareData();
    } else {
      setError({
        error: 'invalid_token',
        code: 400,
        message: '不正なトークンです'
      });
      setLoading(false);
    }
  }, [token]);

  const handleArtifactView = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedArtifact(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            共有データを読み込んでいます...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  if (!data) {
    return (
      <ErrorPage
        error={{
          error: 'no_data',
          code: 500,
          message: 'データを取得できませんでした'
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {data.child_public.initial}の学習記録
              </h1>
              <p className="text-gray-600 mt-1">
                {data.child_public.grade} • 共有リンク経由で閲覧中
              </p>
            </div>
            <StatusBanner status={data.token_status} />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-12">
          {/* 関心サマリー */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                関心のある分野
              </h2>
              <p className="text-gray-600">
                学習活動から分析された興味・関心の上位3分野です
              </p>
            </div>

            {data.interest_summary.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {data.interest_summary.slice(0, 3).map((interest, index) => (
                  <InterestCard key={index} interest={interest} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <div className="text-gray-400 mb-4">
                  <span className="text-6xl" role="img" aria-label="考える顔">
                    🤔
                  </span>
                </div>
                <p className="text-gray-500">
                  関心データを分析中です
                </p>
              </div>
            )}
          </section>

          {/* 成果物ギャラリー */}
          <section>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                成果物ギャラリー
              </h2>
              <p className="text-gray-600">
                学習活動で作成された成果物の一覧です
              </p>
            </div>

            <ArtifactGrid
              artifacts={data.artifacts.slice(0, 6)}
              onArtifactView={handleArtifactView}
            />

            {data.artifacts.length > 6 && (
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  表示: {Math.min(6, data.artifacts.length)} / {data.artifacts.length} 件
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-2">
              <span role="img" aria-label="情報アイコン">ℹ️</span>
              この情報は共有リンク経由で閲覧しています
            </div>
            <p className="text-xs text-gray-400">
              プライバシー保護のため、一部の情報は制限されています
            </p>
          </div>
        </div>
      </footer>

      {/* モーダル */}
      <ArtifactModal
        artifact={selectedArtifact}
        isOpen={modalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}