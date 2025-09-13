import { useState } from 'react'
import { Layout } from './components/layout'
import { useAppData } from './hooks/useAppData'
import { FamilyUid } from './domain'
import Dashboard from './components/features/Dashboard'
import MemberList from './components/features/MemberList'
import TaskList from './components/features/TaskList'
import EvidenceList from './components/features/EvidenceList'
import BackupManagement from './components/features/BackupManagement'
import { LoadingSpinner } from './components/ui'

// サンプルの家族UID（実際の実装では認証やセットアップで決定）
const SAMPLE_FAMILY_UID = FamilyUid.generate().toString()

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
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

  return (
    <Layout 
      currentPage={currentPage}
      onPageChange={setCurrentPage}
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