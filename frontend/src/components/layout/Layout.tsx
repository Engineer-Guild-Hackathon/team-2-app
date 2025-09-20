import { ReactNode, useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
  currentPage?: string
  onPageChange?: (page: string) => void
  onBackToRoleSelection?: () => void
}

const Layout = ({ children, currentPage = 'dashboard', onPageChange, onBackToRoleSelection }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const sidebarItems = [
    {
      id: 'dashboard',
      label: 'ダッシュボード',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
        </svg>
      ),
      active: currentPage === 'dashboard',
      onClick: () => {
        onPageChange?.('dashboard')
        setIsSidebarOpen(false)
      }
    },
    {
      id: 'members',
      label: 'メンバー管理',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      active: currentPage === 'members',
      onClick: () => {
        onPageChange?.('members')
        setIsSidebarOpen(false)
      }
    },
    {
      id: 'tasks',
      label: 'タスク管理',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      active: currentPage === 'tasks',
      onClick: () => {
        onPageChange?.('tasks')
        setIsSidebarOpen(false)
      }
    },
    {
      id: 'evidence',
      label: 'エビデンス',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      active: currentPage === 'evidence',
      onClick: () => {
        onPageChange?.('evidence')
        setIsSidebarOpen(false)
      }
    },
    {
      id: 'backup',
      label: 'バックアップ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      ),
      active: currentPage === 'backup',
      onClick: () => {
        onPageChange?.('backup')
        setIsSidebarOpen(false)
      }
    },
    {
      id: 'ai-recommendations',
      label: 'AIおすすめ',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      active: currentPage === 'ai-recommendations',
      onClick: () => {
        onPageChange?.('ai-recommendations')
        setIsSidebarOpen(false)
      }
    }
  ]

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      <Sidebar 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        items={sidebarItems}
      />
      
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          onBackToRoleSelection={onBackToRoleSelection}
        />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-3 sm:py-4 lg:py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout