import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const carrier_id = searchParams.get('carrier_id')
    const network_type = searchParams.get('network_type')
    const plan_type = searchParams.get('plan_type')
    const min_price = searchParams.get('min_price')
    const max_price = searchParams.get('max_price')

    let query = supabase
      .from('plans')
      .select(`
        *,
        carrier:carriers(*)
      `)
      .eq('is_active', true)

    if (carrier_id) query = query.eq('carrier_id', carrier_id)
    if (network_type) query = query.eq('network_type', network_type)
    if (plan_type) query = query.eq('plan_type', plan_type)
    if (min_price) query = query.gte('monthly_fee', parseInt(min_price))
    if (max_price) query = query.lte('monthly_fee', parseInt(max_price))

    query = query.order('monthly_fee', { ascending: true })

    const { data, error } = await query

    if (error) {
      console.error('Plans query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Plans API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
