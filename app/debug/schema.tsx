"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/components/providers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SchemaPage() {
  const { supabase } = useSupabase()
  const [tables, setTables] = useState<any[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [columns, setColumns] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTables = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // This query gets all tables in the public schema
        const { data, error } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public')
        
        if (error) throw error
        
        setTables(data || [])
      } catch (err: any) {
        console.error("Error fetching tables:", err)
        setError(err.message || "Failed to fetch tables")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTables()
  }, [supabase])

  const fetchTableInfo = async (tableName: string) => {
    setIsLoading(true)
    setError(null)
    setSelectedTable(tableName)
    
    try {
      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
      
      if (columnsError) throw columnsError
      
      setColumns(columnsData || [])
      
      // Fetch sample rows
      const { data: rowsData, error: rowsError } = await supabase
        .from(tableName)
        .select('*')
        .limit(5)
      
      if (rowsError) throw rowsError
      
      setRows(rowsData || [])
    } catch (err: any) {
      console.error(`Error fetching info for table ${tableName}:`, err)
      setError(err.message || `Failed to fetch info for table ${tableName}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Database Schema</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tables</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && !selectedTable ? (
                <p>Loading tables...</p>
              ) : error && !selectedTable ? (
                <p className="text-red-500">{error}</p>
              ) : (
                <div className="space-y-2">
                  {tables.map((table) => (
                    <Button
                      key={table.tablename}
                      variant={selectedTable === table.tablename ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => fetchTableInfo(table.tablename)}
                    >
                      {table.tablename}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-3">
          {selectedTable ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Columns for {selectedTable}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading columns...</p>
                  ) : error ? (
                    <p className="text-red-500">{error}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left">Column Name</th>
                            <th className="p-2 text-left">Data Type</th>
                            <th className="p-2 text-left">Nullable</th>
                          </tr>
                        </thead>
                        <tbody>
                          {columns.map((column, index) => (
                            <tr key={index} className="border-b border-muted">
                              <td className="p-2">{column.column_name}</td>
                              <td className="p-2">{column.data_type}</td>
                              <td className="p-2">{column.is_nullable === 'YES' ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sample Rows for {selectedTable}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <p>Loading rows...</p>
                  ) : error ? (
                    <p className="text-red-500">{error}</p>
                  ) : rows.length === 0 ? (
                    <p>No rows found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            {Object.keys(rows[0]).map((key) => (
                              <th key={key} className="p-2 text-left">{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-b border-muted">
                              {Object.values(row).map((value: any, valueIndex) => (
                                <td key={valueIndex} className="p-2">
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '')
                                    : String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Select a table to view its schema and sample data</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 