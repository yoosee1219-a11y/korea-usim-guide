# Verify Deployment Skill

This skill checks the deployment status and verifies everything is working correctly.

## What this skill does:

1. **Check Git status** - verify all changes are committed
2. **Check Supabase** - verify translations are in database
3. **Check Vercel** - verify deployment status
4. **Test blog pages** - verify 12 languages are working
5. **Generate health report**

## Usage:

Run this skill after deployment to verify everything is working.

## Steps:

1. Run git status to check uncommitted changes
2. Query Supabase for blog count and translations
3. Check if Vercel deployment is complete
4. Verify blog pages are accessible
5. Test language switching functionality
6. Generate comprehensive health report

## Expected Output:

- Git status: clean (all committed)
- Supabase: 20 blogs × 12 languages = 240 entries
- Vercel: deployment successful
- Blog pages: all 12 languages working
- Health report with all checks passed
