import { Link, Route, Routes } from 'react-router-dom';
import { SpiritsPage } from './pages/SpiritsPage';
import { HomePage } from './pages/HomePage';

export default function App() {
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #333' }}>
        <Link to="/" style={{ marginRight: 16, color: '#ccc' }}>首页</Link>
        <Link to="/spirits" style={{ color: '#ccc' }}>图鉴</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/spirits" element={<SpiritsPage />} />
      </Routes>
    </div>
  );
}
