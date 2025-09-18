import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainApp from './components/MainApp'
import { SharePageWrapper } from './components/share/SharePageWrapper'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/s/:shortId" element={<SharePageWrapper />} />
      </Routes>
    </Router>
  )
}

export default App