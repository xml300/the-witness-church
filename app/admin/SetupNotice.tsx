export default function SetupNotice() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-bg px-6">
      <div className="max-w-lg bg-white rounded-2xl border border-gray-2 p-8">
        <h1 className="text-xl font-extrabold text-navy mb-3">Admin is not connected yet</h1>
        <ol className="list-decimal pl-5 text-sm text-text space-y-2">
          <li>Create a free project at supabase.com.</li>
          <li>Run <code>supabase/schema.sql</code> in the SQL Editor.</li><li>Create the admin user under Authentication, then Users, with Auto Confirm ticked.</li>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> and fill in the project URL and anon key.</li>
          <li>Restart the dev server.</li>
        </ol>
        <p className="text-sm text-muted mt-4">
          Until then the public site shows its built-in content.
        </p>
      </div>
    </main>
  );
}
