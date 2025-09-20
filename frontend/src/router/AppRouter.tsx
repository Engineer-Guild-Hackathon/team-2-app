import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { RecommendationLayout } from '../components/layout/RecommendationLayout';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy load components for better performance
const RecommendationsHome = React.lazy(() =>
  import('../components/features/recommendations/RecommendationsHome').then(module => ({
    default: module.RecommendationsHome
  }))
);

const ChildAIRecommendations = React.lazy(() =>
  import('../components/features/ChildAIRecommendations').then(module => ({
    default: module.ChildAIRecommendations
  }))
);

// Component to route between child and adult UI based on mode
const RecommendationRouter: React.FC = () => {
  const { mode } = useParams<{ mode: string }>();

  if (mode === 'learner') {
    return <ChildAIRecommendations />;
  }

  return <RecommendationsHome />;
};

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">読み込み中...</p>
    </div>
  </div>
);

export function AppRouter() {
  return (
    <ErrorBoundary>
      <RecommendationLayout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Recommendations routes */}
            <Route path="/" element={<RecommendationsHome />} />
            <Route path="/:mode" element={<RecommendationRouter />} />

            {/* 404 Not Found */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </RecommendationLayout>
    </ErrorBoundary>
  );
}

// 404 Not Found page component
const NotFoundPage: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="text-8xl mb-4" role="img" aria-label="Not found">🔍</div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        ページが見つかりません
      </h1>
      <p className="text-gray-600 mb-8">
        お探しのページは削除されたか、URLが間違っている可能性があります。
      </p>
      <a
        href="/recommendations"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        ホームに戻る
      </a>
    </div>
  </div>
);