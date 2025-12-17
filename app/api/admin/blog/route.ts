import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Get all blog posts (admin)
export async function GET(request: NextRequest) {
  try {
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Blog fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const postData = {
      title_ko: body.title_ko,
      content_ko: body.content_ko,
      excerpt_ko: body.excerpt_ko,
      slug: body.slug,
      category: body.category,
      tags: body.tags,
      featured_image: body.featured_image,
      author: body.author || 'Admin',
      is_published: body.is_published || false,
      published_at: body.is_published ? new Date().toISOString() : null
    }

    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .insert([postData])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Blog create error:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

// PUT - Update blog post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    const updateData: any = {
      title_ko: body.title_ko,
      content_ko: body.content_ko,
      excerpt_ko: body.excerpt_ko,
      slug: body.slug,
      category: body.category,
      tags: body.tags,
      featured_image: body.featured_image,
      is_published: body.is_published
    }

    if (body.is_published && !body.published_at) {
      updateData.published_at = new Date().toISOString()
    }

    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Blog update error:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blog delete error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
