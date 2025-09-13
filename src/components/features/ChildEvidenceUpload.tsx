import { useState } from 'react'
import { Evidence, Member, Task } from '../../domain/entities'
import { Card, CardContent, Button } from '../ui'

interface ChildEvidenceUploadProps {
  child: Member
  tasks: Task[]
  onAddEvidence: (evidence: Omit<Evidence, 'familyUid' | 'evidenceId' | 'createdAt'>) => Promise<Evidence>
  onBack: () => void
  initialTaskId?: string
}

const ChildEvidenceUpload = ({ child, tasks, onAddEvidence, onBack, initialTaskId }: ChildEvidenceUploadProps) => {
  const [selectedType, setSelectedType] = useState<Evidence['kind'] | null>(null)
  const [selectedTask, setSelectedTask] = useState<string | null>(initialTaskId ?? null)
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const childTasks = tasks.filter(task => 
    task.assigneeMemberId === child.memberId && 
    (task.status === 'doing' || task.status === 'done')
  )

  const handleSubmit = async () => {
    if (!selectedType) return

    setIsSubmitting(true)
    try {
      await onAddEvidence({
        childMemberId: child.memberId,
        kind: selectedType,
        text: selectedType === 'note' ? text : undefined,
        blobRef: selectedType !== 'note' ? `${selectedType}-${Date.now()}` : undefined,
        taskId: selectedTask || undefined,
        tags: ['express'] // 子どもからの投稿は表現タグを付ける
      })

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        onBack()
      }, 2000)
    } catch (error) {
      console.error('Failed to add evidence:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 成功画面
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="text-center animate-bounce">
          <div className="text-9xl mb-8">🎉</div>
          <h1 className="text-6xl font-bold text-green-500 mb-4">
            とうこうできたよ！
          </h1>
          <p className="text-2xl text-gray-700">
            すてきな きろくが できました
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">📸</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  きろくを のこそう
                </h1>
                <p className="text-lg text-gray-600">がんばったことを おしえてね</p>
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
        {/* ステップ1: 種類選択 */}
        {!selectedType && (
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                どんな きろくを のこす？
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => setSelectedType('photo')}
                  className="bg-blue-100 text-blue-800 border border-blue-300 p-8 rounded-2xl hover:bg-blue-200 transition-colors"
                >
                  <div className="text-6xl mb-4">📷</div>
                  <h3 className="text-2xl font-bold mb-2">しゃしん</h3>
                  <p className="text-sm">がんばっている ようすを さつえい</p>
                </button>

                <button
                  onClick={() => setSelectedType('voice')}
                  className="bg-pink-100 text-pink-800 border border-pink-300 p-8 rounded-2xl hover:bg-pink-200 transition-colors"
                >
                  <div className="text-6xl mb-4">🎤</div>
                  <h3 className="text-2xl font-bold mb-2">おんせい</h3>
                  <p className="text-sm">こえで かんそうを ろくおん</p>
                </button>

                <button
                  onClick={() => setSelectedType('note')}
                  className="bg-green-100 text-green-800 border border-green-300 p-8 rounded-2xl hover:bg-green-200 transition-colors"
                >
                  <div className="text-6xl mb-4">✏️</div>
                  <h3 className="text-2xl font-bold mb-2">ぶんしょう</h3>
                  <p className="text-sm">おもったことを もじで かく</p>
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ステップ2: 内容入力・関連タスク選択 */}
        {selectedType && (
          <div className="space-y-6">
            {/* 選択した種類の表示 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">
                      {selectedType === 'photo' && '📷'}
                      {selectedType === 'voice' && '🎤'}
                      {selectedType === 'note' && '✏️'}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedType === 'photo' && 'しゃしんを とろう'}
                      {selectedType === 'voice' && 'おんせいを ろくおんしよう'}
                      {selectedType === 'note' && 'ぶんしょうを かこう'}
                    </h2>
                  </div>
                  <Button
                    onClick={() => setSelectedType(null)}
                    variant="outline"
                  >
                    やりなおす
                  </Button>
                </div>

                {selectedType === 'note' && (
                  <div className="mb-6">
                    <label className="block text-lg font-bold text-gray-700 mb-3">
                      なにを おもったかな？
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                      placeholder="きょう がんばったことや たのしかったことを かいてね..."
                    />
                  </div>
                )}

                {selectedType !== 'note' && (
                  <div className="mb-6 p-8 border-2 border-dashed border-gray-300 rounded-xl text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <p className="text-lg text-gray-600 mb-4">
                      {selectedType === 'photo' ? 'カメラで しゃしんを とってね' : 'マイクで おんせいを ろくおんしてね'}
                    </p>
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 text-lg"
                    >
                      {selectedType === 'photo' ? '📷 しゃしんを とる' : '🎤 ろくおんする'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 関連タスク選択 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  どの おべんきょうの きろく？
                </h3>
                <p className="text-gray-600 mb-4">かんけいある おべんきょうを えらんでね</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setSelectedTask(null)}
                    aria-pressed={selectedTask === null}
                    className={`p-4 border-2 rounded-xl text-left transition-colors ${
                      selectedTask === null 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">🌟</div>
                    <h4 className="font-bold">その他</h4>
                    <p className="text-sm text-gray-600">とくべつな おべんきょうじゃない</p>
                  </button>

                  {childTasks.map((task) => (
                    <button
                      key={task.taskId}
                      onClick={() => setSelectedTask(task.taskId)}
                      aria-pressed={selectedTask === task.taskId}
                      className={`p-4 border-2 rounded-xl text-left transition-colors ${
                        selectedTask === task.taskId 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-2">
                        {task.type === 'homework' && '📝'}
                        {task.type === 'test' && '📚'}
                        {task.type === 'inquiry' && '🔍'}
                        {task.type === 'life' && '🏠'}
                      </div>
                      <h4 className="font-bold">{task.title}</h4>
                      <p className="text-sm text-gray-600">
                        {task.status === 'done' ? 'かんりょう' : 'しんこうちゅう'}
                      </p>
                    </button>
                  ))}
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || (selectedType === 'note' && !text.trim())}
                    variant="outline"
                    className="bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200 text-xl py-4 px-8"
                    size="lg"
                  >
                    {isSubmitting ? '📤 そうしんちゅう...' : '📤 きろくを のこす'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChildEvidenceUpload
