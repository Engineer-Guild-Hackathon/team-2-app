import { useState } from 'react'
import { Task, Member } from '../../domain/entities'
import { Card, CardContent, Button } from '../ui'

interface ChildTaskAddProps {
  child: Member
  onAddTask: (task: Omit<Task, 'familyUid' | 'taskId' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  onBack: () => void
}

const ChildTaskAdd = ({ child, onAddTask, onBack }: ChildTaskAddProps) => {
  const [title, setTitle] = useState('')
  const [selectedType, setSelectedType] = useState<Task['type']>('homework')
  const [subject, setSubject] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onAddTask({
        title: title.trim(),
        type: selectedType,
        subject: subject.trim() || undefined,
        assigneeMemberId: child.memberId
      })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onBack()
      }, 2000)
    } catch (error) {
      console.error('Failed to add task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 成功画面
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="text-center animate-bounce">
          <div className="text-9xl mb-8">✅</div>
          <h1 className="text-4xl font-bold text-green-700 mb-4">
            ついかできたよ！
          </h1>
          <p className="text-xl text-gray-700">
            あたらしい やることが できました
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">📝</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  あたらしい やることを つくろう
                </h1>
                <p className="text-lg text-gray-600">がんばりたいことを おしえてね</p>
              </div>
            </div>
            <Button
              onClick={onBack}
              variant="outline"
              size="lg"
              className="text-lg"
            >
              もどる
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* タスク名入力 */}
        <Card className="bg-white border border-blue-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              なにを がんばる？
            </h2>
            
            <div className="mb-6">
              <label className="block text-lg font-bold text-gray-700 mb-3">
                やることの なまえ
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-blue-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="れい: かんじのれんしゅう"
              />
            </div>

            {selectedType === 'homework' && (
              <div className="mb-6">
                <label className="block text-lg font-bold text-gray-700 mb-3">
                  なんの きょうか？
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-blue-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="れい: こくご、さんすう"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 種類選択 */}
        <Card className="bg-white border border-blue-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              どんな しゅるい？
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedType('homework')}
                className={`p-6 border-2 rounded-xl text-left transition-colors ${
                  selectedType === 'homework'
                    ? 'border-yellow-300 bg-yellow-50'
                    : 'border-gray-200 hover:border-yellow-200 hover:bg-yellow-100'
                }`}
              >
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-xl font-bold text-gray-800">しゅくだい</h3>
                <p className="text-gray-600">がっこうから だされたもの</p>
              </button>

              <button
                onClick={() => setSelectedType('test')}
                className={`p-6 border-2 rounded-xl text-left transition-colors ${
                  selectedType === 'test'
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-red-200 hover:bg-red-100'
                }`}
              >
                <div className="text-4xl mb-3">📚</div>
                <h3 className="text-xl font-bold text-gray-800">てすと</h3>
                <p className="text-gray-600">しけんの べんきょう</p>
              </button>

              <button
                onClick={() => setSelectedType('inquiry')}
                className={`p-6 border-2 rounded-xl text-left transition-colors ${
                  selectedType === 'inquiry'
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200 hover:bg-purple-100'
                }`}
              >
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-xl font-bold text-gray-800">しらべもの</h3>
                <p className="text-gray-600">じぶんで しらべること</p>
              </button>

              <button
                onClick={() => setSelectedType('life')}
                className={`p-6 border-2 rounded-xl text-left transition-colors ${
                  selectedType === 'life'
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-green-200 hover:bg-green-100'
                }`}
              >
                <div className="text-4xl mb-3">🏠</div>
                <h3 className="text-xl font-bold text-gray-800">せいかつ</h3>
                <p className="text-gray-600">おうちでやること</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 追加ボタン */}
        <div className="text-center">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            variant="outline"
            className="bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 text-xl py-4 px-8 rounded-xl"
            size="lg"
          >
            {isSubmitting ? '📝 つくっています...' : '📝 やることを つくる'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChildTaskAdd
