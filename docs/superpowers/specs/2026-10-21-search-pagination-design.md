# Search pagination design

The approved change extends the existing keyword, tag, and sort search flow. Today `GET /api/documents` always returns at most the first 20 matches, leaving later matches inaccessible.

- Keep the JSON response body as an array of documents and the default first page, so existing API clients continue to work.
- Accept a zero-based `page` parameter with 20 documents per page. Reject a negative page with HTTP 400. Make ordering deterministic when primary sort values tie by sorting on document ID second.
- Expose whether another page exists through an `X-Has-More` response header, including for an exactly full final page. Expose that header to the configured browser origin.
- The UI initially loads page 0. Show a `加载更多` button only when the response says another page exists; append subsequent pages for the committed query, tag, and sort. A new search, tag, or sort selection starts again at page 0. Keep the current results visible if loading a later page fails, and allow retry.
- When more pages exist, the result summary describes the number loaded, not a total count. Preserve keyword highlighting on appended documents.
- Cover API pagination/filter/validation and frontend append/reset/error behavior with tests. Run all tests and the frontend build before pushing.
