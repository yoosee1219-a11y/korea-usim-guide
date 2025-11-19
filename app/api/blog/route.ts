import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')

    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('is_published', true)

    if (category) {
      query = query.eq('category', category)
    }

    query = query.order('published_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Blog query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Blog API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
