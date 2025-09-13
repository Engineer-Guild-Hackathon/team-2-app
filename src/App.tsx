import { useState } from 'react'
import { Layout } from './components/layout'
import { useAppData } from './hooks/useAppData'
import { FamilyUid } from './domain'
import Dashboard from './components/features/Dashboard'
import MemberList from './components/features/MemberList'
import TaskList from './components/features/TaskList'
import EvidenceList from './components/features/EvidenceList'
import BackupManagement from './components/features/BackupManagement'
import RoleSelection from './components/features/RoleSelection'
import ChildDashboard from './components/features/ChildDashboard'
import { LoadingSpinner, Button } from './components/ui'

// サンプルの家族UID（実際の実装では認証やセットアップで決定）
const SAMPLE_FAMILY_UID = FamilyUid.generate().toString()

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [userRole, setUserRole] = useState<'adult' | 'child' | null>(null)
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const {
    members,
    tasks,
    evidence,
    recommendations,
    loading,
    error,
    addMember,
    updateMember,
    deleteMember,
    addTask,
    updateTaskProgress,
    completeTask,
    addEvidence,
    createBackup,
    restoreBackup
  } = useAppData(SAMPLE_FAMILY_UID)

  const handleRoleSelect = (role: 'adult' | 'child') => {
    setUserRole(role)
    if (role === 'child') {
      // 子どもの場合は子どもメンバーの選択画面を表示
      const children = members.filter(m => m.role === 'child')
      if (children.length === 1) {
        // 子どもが1人だけの場合は自動選択
        setSelectedChild(children[0].memberId)
      }
    }
  }

  const handleChildSelect = (childId: string) => {
    setSelectedChild(childId)
  }

  const handleBackToRoleSelection = () => {
    setUserRole(null)
    setSelectedChild(null)
  }

  // 役割選択画面
  if (!userRole) {
    return <RoleSelection onRoleSelect={handleRoleSelect} />
  }

  // 子ども向け画面
  if (userRole === 'child') {
    const children = members.filter(m => m.role === 'child')
    
    // 子どもメンバーがいない場合はサンプル作成
    if (children.length === 0) {
      return (
        <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl text-center">
            <div className="text-6xl mb-6">👶</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">こどもメンバーがいません</h1>
            <p className="text-lg text-gray-600 mb-8">
              まずはおとなモードでこどもメンバーをついかしてください
            </p>
            <div className="space-y-4">
              <Button
                onClick={async () => {
                  // サンプル子どもメンバーとタスクを作成
                  try {
                    const newChild = await addMember({
                      displayName: 'たろうくん',
                      role: 'child',
                      birthYear: 2016
                    })
                    
                    // サンプルタスクも作成
                    await addTask({
                      title: 'さんすうのしゅくだい',
                      type: 'homework',
                      subject: 'さんすう',
                      assigneeMemberId: newChild.memberId
                    })
                    
                    await addTask({
                      title: 'えほんをよむ',
                      type: 'life',
                      assigneeMemberId: newChild.memberId
                    })
                    
                    // 子どもを選択
                    setSelectedChild(newChild.memberId)
                  } catch (error) {
                    console.error('Failed to create sample child:', error)
                  }
                }}
                variant="outline"
                className="bg-green-100 text-green-800 border border-green-300 hover:bg-green-200 text-lg py-3 px-6"
                size="lg"
              >
                📚 サンプルでじっけんする
              </Button>
              <Button
                onClick={() => setUserRole('adult')}
                variant="outline"
                className="bg-blue-100 text-blue-800 border border-blue-300 hover:bg-blue-200 text-lg py-3 px-6"
                size="lg"
              >
                おとなモードにいく
              </Button>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleBackToRoleSelection}
                variant="outline"
                size="sm"
              >
                やくわりせんたくにもどる
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    // 子どもが複数いる場合の選択画面
    if (!selectedChild && children.length > 1) {
      return (
        <div className="min-h-screen bg-pink-50 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">だれですか？</h1>
              <p className="text-xl text-gray-600">じぶんのなまえをタップしてね</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {children.map((child) => (
                <div
                  key={child.memberId}
                  onClick={() => handleChildSelect(child.memberId)}
                  className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer hover:scale-105 transition-transform text-center"
                >
                  <div className="text-6xl mb-4">👶</div>
                  <h2 className="text-2xl font-bold text-pink-600">{child.displayName}ちゃん</h2>
                  {child.birthYear && (
                    <p className="text-gray-600 mt-2">
                      {new Date().getFullYear() - child.birthYear}さい
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <button
                onClick={handleBackToRoleSelection}
                className="text-gray-500 underline"
              >
                もどる
              </button>
            </div>
          </div>
        </div>
      )
    }

    // 子どもダッシュボード
    const child = children.find(c => c.memberId === selectedChild) || children[0]
    if (child) {
      return (
        <ChildDashboard
          child={child}
          tasks={tasks}
          onTaskComplete={completeTask}
          onAddEvidence={addEvidence}
          onAddTask={addTask}
          onBackToRoleSelection={handleBackToRoleSelection}
        />
      )
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'members':
        return (
          <MemberList
            members={members}
            loading={loading}
            onAddMember={addMember}
            onUpdateMember={updateMember}
            onDeleteMember={deleteMember}
          />
        )
      case 'tasks':
        return (
          <TaskList
            tasks={tasks}
            members={members}
            loading={loading}
            onAddTask={addTask}
            onUpdateTaskProgress={updateTaskProgress}
            onCompleteTask={completeTask}
          />
        )
      case 'evidence':
        return (
          <EvidenceList
            evidence={evidence}
            members={members}
            tasks={tasks}
            loading={loading}
            onAddEvidence={addEvidence}
          />
        )
      case 'backup':
        return (
          <BackupManagement
            loading={loading}
            onCreateBackup={createBackup}
            onRestoreBackup={restoreBackup}
          />
        )
      default:
        return (
          <Dashboard
            members={members}
            tasks={tasks}
            evidence={evidence}
            loading={loading}
          />
        )
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </div>
    )
  }

  // 大人向け画面
  return (
    <Layout 
      currentPage={currentPage}
      onPageChange={setCurrentPage}
      onBackToRoleSelection={handleBackToRoleSelection}
    >
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {currentPage === 'dashboard' && 'ダッシュボード'}
            {currentPage === 'members' && 'メンバー管理'}
            {currentPage === 'tasks' && 'タスク管理'}
            {currentPage === 'evidence' && 'エビデンス収集'}
            {currentPage === 'backup' && 'バックアップ'}
          </h1>
        </div>
        
        {renderPage()}
      </div>
    </Layout>
  )
}

export default App
