import { useState } from 'react'
import { Button } from '../ui'

interface HeaderProps {
  familyName?: string
  onMenuClick?: () => void
}

const Header = ({ familyName = 'ほめログ', onMenuClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center ml-2 md:ml-0">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">{familyName}</h1>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#dashboard" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              ダッシュボード
            </a>
            <a href="#members" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              メンバー
            </a>
            <a href="#tasks" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              タスク
            </a>
            <a href="#evidence" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              エビデンス
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              バックアップ
            </Button>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">家</span>
                </div>
              </button>
              
              {isMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <a href="#settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      設定
                    </a>
                    <a href="#help" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      ヘルプ
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
            <a href="#dashboard" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              ダッシュボード
            </a>
            <a href="#members" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              メンバー
            </a>
            <a href="#tasks" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              タスク
            </a>
            <a href="#evidence" className="text-gray-500 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium">
              エビデンス
            </a>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header