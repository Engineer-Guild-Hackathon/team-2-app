import { useParams, useSearchParams } from 'react-router-dom';
import { SharePage } from './SharePage';
import { ErrorPage } from './ErrorPage';

export function SharePageWrapper() {
  const { shortId } = useParams<{ shortId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (!shortId || !token) {
    return (
      <ErrorPage
        error={{
          error: 'invalid_url',
          code: 400,
          message: '不正なURLです。共有リンクを確認してください。'
        }}
      />
    );
  }

  return <SharePage token={token} />;
}