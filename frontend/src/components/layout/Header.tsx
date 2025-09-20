import { useState } from 'react'
import { Button } from '../ui'

interface HeaderProps {
  familyName?: string
  onMenuClick?: () => void
  onBackToRoleSelection?: () => void
}

const Header = ({ familyName = 'ほめログ', onMenuClick, onBackToRoleSelection }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo and Title */}
          <div className="flex items-center min-w-0 flex-1">
            <button
              onClick={onMenuClick}
              className="md:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{familyName}</h1>
              </div>
            </div>
          </div>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex space-x-6 xl:space-x-8">
            <a href="#dashboard" className="text-gray-500 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              ダッシュボード
            </a>
            <a href="#members" className="text-gray-500 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              メンバー
            </a>
            <a href="#tasks" className="text-gray-500 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              タスク
            </a>
            <a href="#evidence" className="text-gray-500 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium whitespace-nowrap">
              エビデンス
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {onBackToRoleSelection && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBackToRoleSelection}
                className="hidden sm:inline-flex text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
              >
                <span className="hidden md:inline">役割選択に戻る</span>
                <span className="md:hidden">戻る</span>
              </Button>
            )}
            <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2">
              <span className="hidden lg:inline">バックアップ</span>
              <span className="lg:hidden">📁</span>
            </Button>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1"
              >
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xs sm:text-sm font-medium text-blue-600">🏚</span>
                </div>
              </button>

              {isMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-44 sm:w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <a href="#settings" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      設定
                    </a>
                    <a href="#help" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      ヘルプ
                    </a>
                    {onBackToRoleSelection && (
                      <button
                        onClick={onBackToRoleSelection}
                        className="sm:hidden w-full text-left block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        役割選択に戻る
                      </button>
                    )}
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