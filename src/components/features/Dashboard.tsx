import { Member, Task, Evidence } from '../../domain/entities'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../ui'

interface DashboardProps {
  members: Member[]
  tasks: Task[]
  evidence: Evidence[]
  loading: boolean
}

const Dashboard = ({ members, tasks, evidence, loading }: DashboardProps) => {
  // 統計情報の計算
  const getTaskStats = () => {
    const todoTasks = tasks.filter(t => t.status === 'todo').length
    const doingTasks = tasks.filter(t => t.status === 'doing').length
    const doneTasks = tasks.filter(t => t.status === 'done' || t.status === 'done_with_evidence').length
    const completionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0
    
    return { todoTasks, doingTasks, doneTasks, completionRate }
  }

  const getMemberStats = () => {
    const children = members.filter(m => m.role === 'child')
    const parents = members.filter(m => m.role === 'parent')
    
    return { children: children.length, parents: parents.length, total: members.length }
  }

  const getRecentActivity = () => {
    // 最近のタスクとエビデンスを結合してソート
    const recentTasks = tasks
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3)
      .map(task => ({
        type: 'task' as const,
        title: task.title,
        member: members.find(m => m.memberId === task.assigneeMemberId)?.displayName || '不明',
        status: task.status,
        time: task.updatedAt
      }))

    const recentEvidence = evidence
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 3)
      .map(ev => ({
        type: 'evidence' as const,
        title: `${ev.kind}を追加`,
        member: members.find(m => m.memberId === ev.childMemberId)?.displayName || '不明',
        status: ev.kind,
        time: ev.createdAt
      }))

    return [...recentTasks, ...recentEvidence]
      .sort((a, b) => b.time - a.time)
      .slice(0, 5)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'todo': return 'default'
      case 'doing': return 'warning'
      case 'done':
      case 'done_with_evidence': return 'success'
      case 'photo':
      case 'voice':
      case 'note': return 'info'
      default: return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return '未着手'
      case 'doing': return '進行中'
      case 'done': return '完了'
      case 'done_with_evidence': return '完了(記録あり)'
      case 'photo': return '写真'
      case 'voice': return '音声'
      case 'note': return 'メモ'
      default: return status
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return '今'
    if (diffInHours < 24) return `${diffInHours}時間前`
    if (diffInHours < 48) return '昨日'
    return date.toLocaleDateString('ja-JP')
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent>
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const taskStats = getTaskStats()
  const memberStats = getMemberStats()
  const recentActivity = getRecentActivity()

  return (
    <div className="space-y-6">
      {/* 概要統計 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">メンバー数</dt>
                    <dd className="text-lg font-medium text-gray-900">{memberStats.total}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">完了タスク</dt>
                    <dd className="text-lg font-medium text-gray-900">{taskStats.doneTasks}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">進行中タスク</dt>
                    <dd className="text-lg font-medium text-gray-900">{taskStats.doingTasks}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">エビデンス数</dt>
                    <dd className="text-lg font-medium text-gray-900">{evidence.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 完了率 */}
        <Card>
          <CardHeader>
            <CardTitle>タスク完了率</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <span className="text-3xl font-bold text-blue-600">{taskStats.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${taskStats.completionRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>完了: {taskStats.doneTasks}</span>
                <span>合計: {tasks.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 最近のアクティビティ */}
        <Card>
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                アクティビティがありません
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {activity.type === 'task' ? (
                          <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.member}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeVariant(activity.status)} size="sm">
                        {getStatusLabel(activity.status)}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatTime(activity.time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard