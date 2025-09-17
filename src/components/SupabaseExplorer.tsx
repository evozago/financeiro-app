import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

interface SupabaseExplorerProps {}

export default function SupabaseExplorer({}: SupabaseExplorerProps) {
  const [tableName, setTableName] = useState('contas')
  const [data, setData] = useState<Record<string, any>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadData = async (table: string) => {
    setLoading(true)
    setError(null)
    
    try {
      let query = supabase.from(table).select('*').limit(25)
      
      // Try to order by created_at descending, handle gracefully if column doesn't exist
      try {
        const { data: rows, error } = await query.order('created_at', { ascending: false })
        
        if (error) {
          // If ordering failed (likely column doesn't exist), try without ordering
          if (error.message.includes('created_at')) {
            const { data: fallbackRows, error: fallbackError } = await supabase
              .from(table)
              .select('*')
              .limit(25)
            
            if (fallbackError) throw fallbackError
            setData(fallbackRows || [])
          } else {
            throw error
          }
        } else {
          setData(rows || [])
        }
      } catch (orderError) {
        // Fallback to query without ordering
        const { data: fallbackRows, error: fallbackError } = await supabase
          .from(table)
          .select('*')
          .limit(25)
        
        if (fallbackError) throw fallbackError
        setData(fallbackRows || [])
      }
    } catch (err: any) {
      setError(err.message || 'Erro desconhecido')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  // Auto-load on mount with default table
  useEffect(() => {
    loadData(tableName)
  }, [])

  const handleLoadClick = () => {
    loadData(tableName)
  }

  const renderCellValue = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  const renderTable = () => {
    if (data.length === 0) {
      return <p>Nenhum registro</p>
    }

    const columns = Object.keys(data[0])

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  style={{
                    border: '1px solid #ddd',
                    padding: '8px',
                    backgroundColor: '#f5f5f5',
                    textAlign: 'left'
                  }}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td
                    key={column}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px'
                    }}
                  >
                    {renderCellValue(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>
          {data.length} registro{data.length !== 1 ? 's' : ''} encontrado{data.length !== 1 ? 's' : ''}
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '100%' }}>
      <h2>Supabase Explorer</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder="Nome da tabela (ex.: contas)"
          style={{
            padding: '8px',
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            minWidth: '200px'
          }}
        />
        <button
          onClick={handleLoadClick}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Carregando...' : 'Carregar'}
        </button>
      </div>

      {error && (
        <div style={{ 
          color: 'red', 
          marginBottom: '20px',
          padding: '10px',
          backgroundColor: '#ffe6e6',
          border: '1px solid #ff9999',
          borderRadius: '4px'
        }}>
          Erro: {error}
        </div>
      )}

      {loading && <p>Carregando...</p>}

      {!loading && !error && renderTable()}
    </div>
  )
}