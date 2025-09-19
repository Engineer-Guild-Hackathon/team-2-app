import { useState } from 'react'
import { Card, CardContent } from '../ui'

interface RoleSelectionProps {
  onRoleSelect: (role: 'adult' | 'child') => void
}

const RoleSelection = ({ onRoleSelect }: RoleSelectionProps) => {
  const [selectedRole, setSelectedRole] = useState<'adult' | 'child' | null>(null)

  const handleRoleClick = (role: 'adult' | 'child') => {
    setSelectedRole(role)
    setTimeout(() => {
      onRoleSelect(role)
    }, 300)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            📚 ほめログ 📚
          </h1>
          <p className="text-xl text-gray-600">だれがつかいますか？</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 大人用 */}
          <Card className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
            selectedRole === 'adult' ? 'ring-4 ring-blue-500 scale-105' : ''
          }`}>
            <CardContent>
              <button
                onClick={() => handleRoleClick('adult')}
                className="w-full p-8 text-center focus:outline-none"
              >
                <div className="text-8xl mb-6">👩‍💼</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">おとな</h2>
                <div className="space-y-2 text-gray-600">
                  <p>• かぞくのかんり</p>
                  <p>• たすくのついか</p>
                  <p>• しんちょくかくにん</p>
                  <p>• ばっくあっぷ</p>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* 子ども用 */}
          <Card className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
            selectedRole === 'child' ? 'ring-4 ring-pink-500 scale-105' : ''
          }`}>
            <CardContent>
              <button
                onClick={() => handleRoleClick('child')}
                className="w-full p-8 text-center focus:outline-none"
              >
                <div className="text-8xl mb-6">🧒</div>
                <h2 className="text-3xl font-bold text-pink-600 mb-4">こども</h2>
                <div className="space-y-2 text-gray-600">
                  <p>• きょうのやること</p>
                  <p>• できたよほうこく</p>
                  <p>• しゃしんとうこう</p>
                  <p>• ほめことば</p>
                </div>
              </button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 shadow-lg">
            <h3 className="text-2xl font-bold text-white mb-4">🤖 AIおすすめ機能</h3>
            <p className="text-blue-100 mb-6">
              AIがあなたにぴったりの学習スポットや本をおすすめします
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="/recommendations/learner"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                🎓 学習者モード（子供向け）
              </a>
              <button
                onClick={() => handleRoleClick('adult')}
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors border border-purple-200"
              >
                👨‍👩‍👧‍👦 家族モード（大人向け）
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            タップして選んでね！
          </p>
        </div>
      </div>
    </div>
  )
}

export default RoleSelection
