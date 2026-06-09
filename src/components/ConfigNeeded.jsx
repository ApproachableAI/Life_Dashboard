export default function ConfigNeeded() {
  return (
    <div className="center-screen">
      <div className="config-card">
        <div className="heart">🔧</div>
        <h1 style={{ marginTop: 8 }}>Almost there</h1>
        <p>
          This dashboard needs your Supabase keys. Create a <code>.env</code>{' '}
          file in the project root with:
        </p>
        <pre>{`VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key`}</pre>
        <p style={{ fontSize: '0.85rem' }}>
          Find both in your Supabase project under{' '}
          <strong>Settings → API</strong>, then restart the dev server.
        </p>
      </div>
    </div>
  )
}
