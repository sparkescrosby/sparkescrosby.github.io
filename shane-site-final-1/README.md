# Shane Blog Site (Final package)

## Run locally
Use VS Code Live Server (recommended), or:
python3 -m http.server 8000

Open:
http://localhost:8000/index.html

## Add a new post (no editor yet)
1) Create a new HTML file in: `posts/`
   Example: `posts/my-new-post.html`

2) Add an entry in: `posts/posts.json`
   Example:
   {
     "slug": "my-new-post",
     "title": "My New Post Title",
     "date": "2026-02-10",
     "excerpt": "One sentence that makes someone click.",
     "tags": ["Strategy"],
     "file": "my-new-post.html",
     "headerImage": "assets/headers/aqua-1.svg"
   }

3) Optional: add your own header image
   Put it in: `assets/headers/`
   Then reference it via `headerImage` in posts.json

## Notes
- Homepage automatically lists posts from `posts/posts.json`
- The post page loads the post content from the referenced `file`
