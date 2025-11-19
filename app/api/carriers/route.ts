import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('carriers')
      .select('*')
      .order('id', { ascending: true })

    if (error) {
      console.error('Carriers query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch carriers' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Carriers API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
