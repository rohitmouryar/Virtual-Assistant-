# Contributing to Shifra

Thanks for helping improve Shifra.

1. Open an issue before beginning a large feature, so the goal and UX can be discussed.
2. Keep pull requests focused on one improvement.
3. Do not add API keys, `.env` files, or other secrets to commits.
4. Run `npm run check` before opening a pull request.
5. Test text input, a supported local command, theme switching, and mobile layout when changing the interface.

For AI-related features, preserve the rule that API keys stay server-side and that the app has a graceful fallback when the AI service is unavailable.
