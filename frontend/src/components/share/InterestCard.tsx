import { InterestSummary } from '../../types/share';

interface InterestCardProps {
  interest: InterestSummary;
}

const CONFIDENCE_ICONS = {
  1: '⭐',
  2: '⭐⭐',
  3: '⭐⭐⭐'
} as const;

const INTEREST_ICONS: Record<string, string> = {
  '昆虫観察': '🐛',
  '絵画': '🎨',
  'ブロック工作': '🧱',
  '音楽': '🎵',
  '読書': '📚',
  '運動': '⚽',
  '料理': '👨‍🍳',
  '科学実験': '🔬',
  '植物観察': '🌱',
  'プログラミング': '💻'
};

export function InterestCard({ interest }: InterestCardProps) {
  const icon = INTEREST_ICONS[interest.topic] || '🌟';
  const confidenceIcon = CONFIDENCE_ICONS[interest.confidence];
  const scorePercent = Math.round(interest.score * 100);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl" role="img" aria-label={`${interest.topic}のアイコン`}>
          {icon}
        </span>
        <h3 className="text-lg font-semibold text-gray-800">
          {interest.topic}
        </h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">関心度</span>
          <span className="font-bold text-blue-600">{scorePercent}%</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${scorePercent}%` }}
            role="progressbar"
            aria-valuenow={scorePercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`関心度 ${scorePercent}%`}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">信頼度</span>
          <span className="text-sm" title={`信頼度: ${interest.confidence}/3`}>
            {confidenceIcon}
          </span>
        </div>
      </div>
    </div>
  );
}