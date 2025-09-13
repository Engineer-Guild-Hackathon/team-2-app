import { useState } from 'react'
import { Task, Member, Evidence } from '../../domain/entities'
import { Card, CardContent, Button } from '../ui'
import ChildEvidenceUpload from './ChildEvidenceUpload'
import ChildTaskAdd from './ChildTaskAdd'

interface ChildDashboardProps {
  child: Member
  tasks: Task[]
  onTaskComplete: (taskId: string) => Promise<Task>
  onAddEvidence: (evidence: Omit<Evidence, 'familyUid' | 'evidenceId' | 'createdAt'>) => Promise<Evidence>
  onAddTask: (task: Omit<Task, 'familyUid' | 'taskId' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>) => Promise<Task>
  onBackToRoleSelection: () => void
}

const ChildDashboard = ({ 
  child, 
  tasks, 
  onTaskComplete, 
  onAddEvidence,
  onAddTask,
  onBackToRoleSelection 
}: ChildDashboardProps) => {
  const [showCelebration, setShowCelebration] = useState(false)
  const [completedTaskTitle, setCompletedTaskTitle] = useState('')
  const [showEvidenceUpload, setShowEvidenceUpload] = useState(false)
  const [showTaskAdd, setShowTaskAdd] = useState(false)
  const [evidenceTaskId, setEvidenceTaskId] = useState<string | null>(null)
  const [mood, setMood] = useState<'genki' | 'futsu' | 'tukare'>('futsu')

  // 子どものタスクのみフィルタ
  const childTasks = tasks.filter(task => task.assigneeMemberId === child.memberId)
  const todoTasks = childTasks.filter(task => task.status === 'todo' || task.status === 'doing')
  const doneTasks = childTasks.filter(task => task.status === 'done' || task.status === 'done_with_evidence')

  const handleTaskComplete = async (task: Task) => {
    try {
      await onTaskComplete(task.taskId)
      setCompletedTaskTitle(task.title)
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const getPraiseMessage = () => {
    const messages = [
      'すごいね！ 🌟',
      'がんばったね！ 🎉',
      'えらいね！ 👏',
      'やったね！ 🎊',
      'すばらしい！ ✨',
      'かんぺき！ 💯'
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  const getTaskIcon = (type: Task['type']) => {
    switch (type) {
      case 'homework': return '📝'
      case 'test': return '📚'
      case 'inquiry': return '🔍'
      case 'life': return '🏠'
      default: return '📋'
    }
  }

  const getTaskTypeLabel = (type: Task['type']) => {
    switch (type) {
      case 'homework': return 'しゅくだい'
      case 'test': return 'てすと'
      case 'inquiry': return 'しらべもの'
      case 'life': return 'せいかつ'
      default: return type
    }
  }

  // エビデンス投稿画面
  if (showEvidenceUpload) {
    return (
      <ChildEvidenceUpload
        child={child}
        tasks={tasks}
        onAddEvidence={onAddEvidence}
        initialTaskId={evidenceTaskId ?? undefined}
        onBack={() => {
          setShowEvidenceUpload(false)
          setEvidenceTaskId(null)
        }}
      />
    )
  }

  // タスク追加画面
  if (showTaskAdd) {
    return (
      <ChildTaskAdd
        child={child}
        onAddTask={onAddTask}
        onBack={() => setShowTaskAdd(false)}
      />
    )
  }

  // お祝い画面
  if (showCelebration) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-4">
        <div className="text-center animate-bounce">
          <div className="text-9xl mb-8">🎉</div>
          <h1 className="text-6xl font-bold text-pink-500 mb-4">
            {getPraiseMessage()}
          </h1>
          <p className="text-2xl text-gray-700 mb-8">
            「{completedTaskTitle}」<br />
            ができました！
          </p>
          <div className="flex justify-center space-x-4 text-6xl">
            <span className="animate-pulse">⭐</span>
            <span className="animate-pulse delay-100">⭐</span>
            <span className="animate-pulse delay-200">⭐</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">👋</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {child.displayName}ちゃんの がんばりひょう
                </h1>
                <p className="text-lg text-gray-600">きょうも がんばろうね！</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2" aria-label="今日の調子">
                <button
                  type="button"
                  aria-pressed={mood === 'genki'}
                  onClick={() => setMood('genki')}
                  className={`px-3 py-1 rounded-full border text-sm ${mood === 'genki' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >元気</button>
                <button
                  type="button"
                  aria-pressed={mood === 'futsu'}
                  onClick={() => setMood('futsu')}
                  className={`px-3 py-1 rounded-full border text-sm ${mood === 'futsu' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >ふつう</button>
                <button
                  type="button"
                  aria-pressed={mood === 'tukare'}
                  onClick={() => setMood('tukare')}
                  className={`px-3 py-1 rounded-full border text-sm ${mood === 'tukare' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >つかれ気味</button>
              </div>
              <Button
                onClick={onBackToRoleSelection}
                variant="outline"
                size="lg"
                className="text-lg"
              >
                もどる
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* 進捗サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-green-50 border border-green-200 text-green-800">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold mb-1">{doneTasks.length}</div>
              <div className="text-lg">できたよ！</div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border border-yellow-200 text-yellow-800">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-3xl font-bold mb-1">{todoTasks.length}</div>
              <div className="text-lg">やること</div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border border-purple-200 text-purple-800">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-3xl font-bold mb-1">{doneTasks.length * 10}</div>
              <div className="text-lg">ポイント</div>
            </CardContent>
          </Card>
        </div>

        {/* きろく/ついか ボタン */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <Button
              onClick={() => setShowEvidenceUpload(true)}
              variant="outline"
              className="bg-purple-100 text-purple-800 border border-purple-300 hover:bg-purple-200 text-lg px-6 py-4 rounded-xl"
              size="lg"
            >
              📸 きろくを のこそう
            </Button>
            <Button
              onClick={() => setShowTaskAdd(true)}
              variant="outline"
              className="bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 text-lg px-6 py-4 rounded-xl"
              size="lg"
            >
              ＋ やることを つくる
            </Button>
          </div>
          <p className="text-gray-600 mt-1 text-sm">がんばったことを きろくしたり、やることを つくれるよ</p>
        </div>

        {/* 今日のやること */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="text-3xl mr-3">📝</span>
              きょうの やること
            </h2>

            {todoTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  ぜんぶ できたよ！
                </h3>
                <p className="text-gray-600">すごいね！ きょうは おつかれさま</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todoTasks.map((task) => (
                  <Card key={task.taskId} className="border-2 border-dashed border-gray-300 hover:border-blue-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{getTaskIcon(task.type)}</span>
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
                            <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                              {getTaskTypeLabel(task.type)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="text-sm bg-purple-50 text-purple-800 border border-purple-300 hover:bg-purple-100"
                            onClick={() => {
                              setEvidenceTaskId(task.taskId)
                              setShowEvidenceUpload(true)
                            }}
                          >
                            証拠＋
                          </Button>
                        </div>
                      </div>

                      {task.due && (
                        <div className="text-sm text-gray-600 mb-4">
                          📅 {new Date(task.due).toLocaleDateString('ja-JP')}
                        </div>
                      )}

                      <Button
                        onClick={() => handleTaskComplete(task)}
                        variant="outline"
                        className="w-full bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 text-lg py-3"
                        size="lg"
                      >
                        できたよ！
                      </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

        {/* できたこと */}
        {doneTasks.length > 0 && (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <span className="text-3xl mr-3">🏆</span>
                できたこと
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {doneTasks.slice(0, 6).map((task) => (
                  <div key={task.taskId} className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-2xl mb-2">{getTaskIcon(task.type)}</div>
                    <h3 className="font-bold text-gray-800 text-sm">{task.title}</h3>
                    <div className="text-green-600 font-bold mt-2">
                      ✅ かんりょう
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ChildDashboard
