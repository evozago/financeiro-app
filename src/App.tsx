import SupabaseExplorer from './components/SupabaseExplorer'

function App() {
  return (
    <>
      <header style={{ padding: '20px', borderBottom: '1px solid #ddd' }}>
        <h1>Financeiro App</h1>
        <p>Teste de conectividade com Supabase em produção</p>
      </header>
      <main>
        <SupabaseExplorer />
      </main>
    </>
  )
}

export default App