import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainApp from './components/MainApp'
import { SharePageWrapper } from './components/share/SharePageWrapper'
import { AppRouter } from './router/AppRouter'

function App() {
  return (
    <Router>
      <Routes>
        {/* メインアプリ（既存機能） */}
        <Route path="/app/*" element={<MainApp />} />

        {/* 共有ページ */}
        <Route path="/s/:shortId" element={<SharePageWrapper />} />

        {/* AIレコメンド機能 */}
        <Route path="/recommendations/*" element={<AppRouter />} />

        {/* ルートからメインアプリへリダイレクト */}
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  )
}

export default App