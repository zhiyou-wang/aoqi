import { routePath, useHashRoute, navigate } from './lib/router';
import { SpiritsPage } from './pages/SpiritsPage';
import { HomePage } from './pages/HomePage';

export default function App() {
  const path = routePath(useHashRoute());

  let page;
  if (path === '/spirits') {
    page = <SpiritsPage />;
  } else {
    page = <HomePage />;
  }

  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #333' }}>
        <a
          href="#/"
          onClick={() => navigate('/')}
          style={{ marginRight: 16, color: path === '/' ? '#fff' : '#ccc' }}
        >
          首页
        </a>
        <a
          href="#/spirits"
          onClick={() => navigate('/spirits')}
          style={{ color: path === '/spirits' ? '#fff' : '#ccc' }}
        >
          图鉴
        </a>
      </nav>
      {page}
    </div>
  );
}
