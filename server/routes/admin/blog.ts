import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../../storage/db";
import { blogPosts, insertBlogPostSchema } from "../../../shared/schema";
import { z } from "zod";

const router = Router();

// GET - Get all blog posts (admin)
router.get("/", async (req, res) => {
  try {
    const posts = await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.created_at));

    res.json(posts);
  } catch (error) {
    console.error("Blog fetch error:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// GET - Get single blog post by ID or slug
router.get("/:identifier", async (req, res) => {
  try {
    const { identifier } = req.params;

    // Try to fetch by ID first, then by slug
    let post = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, identifier))
      .limit(1);

    if (post.length === 0) {
      post = await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.slug, identifier))
        .limit(1);
    }

    if (post.length === 0) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post[0]);
  } catch (error) {
    console.error("Blog fetch error:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

// POST - Create new blog post
router.post("/", async (req, res) => {
  try {
    const postData = insertBlogPostSchema.parse(req.body);

    // Set published_at if is_published is true
    const dataToInsert = {
      ...postData,
      published_at: postData.is_published ? new Date() : null,
      tags: postData.tags || [],
    };

    const [newPost] = await db
      .insert(blogPosts)
      .values(dataToInsert)
      .returning();

    res.status(201).json(newPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Blog create error:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// PUT - Update blog post
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = insertBlogPostSchema.partial().parse(req.body);

    // Set published_at if is_published is being set to true
    if (updateData.is_published && !req.body.published_at) {
      updateData.published_at = new Date();
    }

    const [updatedPost] = await db
      .update(blogPosts)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(eq(blogPosts.id, id))
      .returning();

    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(updatedPost);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Blog update error:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// DELETE - Delete blog post
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [deletedPost] = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();

    if (!deletedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Blog delete error:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
});

export default router;
