# Next.js Performance Best Practices Summary

List of context: 
* Use Server Components by default
* Use Client Components only when needed for interactivity, state, effects, or browser APIs
* Keep Client Components small and isolated
* Avoid making entire pages Client Components
* Use Next.js `<Image />` instead of `<img>`
* Provide proper image dimensions or use `fill` correctly
* Optimize/compress source images before upload
* Use `next/font` for font loading
* Keep imports and dependencies lean
* Avoid heavy libraries in shared layouts/global components
* Lazy load heavy components and libraries
* Use `Suspense` with meaningful fallbacks
* Avoid one massive Suspense boundary for the whole page
* Add route-level `loading.tsx` for slow/dynamic routes
* Use `<Link>` for internal navigation
* Use caching and revalidation for non-real-time data
* Use dynamic rendering/no-store only when truly necessary
* Avoid refetching the same data on every load
* Use middleware for lightweight shared route/auth checks
* Avoid heavy logic, DB queries, or business logic in middleware
* Be intentional with session fetching (server for protection, client for UI convenience)
* Use `next/script` for third-party scripts
* Load third-party scripts only where needed
* Choose proper script loading strategy (`afterInteractive`, `lazyOnload`)
* Optimize API routes and Server Actions
* Validate inputs early in API routes/Server Actions
* Return only needed fields from the backend
* Avoid N+1 query patterns
* Add proper database indexes
* Avoid overfetching data
* Avoid unnecessary rerenders
* Paginate or virtualize long lists when needed
* Track Core Web Vitals in production
* Measure real-user performance, not just local Lighthouse
* Use `next/core-web-vitals` ESLint rules
* Follow the Next.js production checklist before deploy
