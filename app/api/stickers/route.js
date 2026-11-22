import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Verified transparent animated GIPHY Sticker IDs (excluding any site-chrome IDs)
const STARTER_STICKERS = [
  // Trending
  { id: 'zVs0a5PC2tioxlmqgJ', title: 'Trending Sticker 1', tags: ['trending', 'vibe', 'fun'] },
  { id: '69AOvJsa99QraxC7dP', title: 'Trending Sticker 2', tags: ['trending', 'hype', 'fun'] },
  { id: 'fdG07xF24smvBim16E', title: 'Trending Sticker 3', tags: ['trending', 'cute'] },
  { id: 'dS1rQkeAlZbmo', title: 'Trending Sticker 4', tags: ['trending', 'cool'] },
  { id: 'Qs1EbHPzBtBvRdECyg', title: 'Trending Sticker 5', tags: ['trending', 'party'] },
  { id: '3oKIPnyeAQ97VB0p0I', title: 'Trending Sticker 6', tags: ['trending', 'vibe'] },
  { id: 'l4L67R0uIRI6S475Ff', title: 'Trending Sticker 7', tags: ['trending', 'reaction'] },
  { id: '7JmuMGOZYJYmeivT8j', title: 'Trending Sticker 8', tags: ['trending', 'happy'] },
  { id: '8lJSORUJrTcjItDgGd', title: 'Trending Sticker 9', tags: ['trending', 'cute'] },

  // Hi / Wave
  { id: 'NGNb0YWcDjPgP9nlAW', title: 'Hi Wave', tags: ['hi', 'hello', 'hey', 'wave', 'trending'] },
  { id: '1JSirM9CWto4poulJi', title: 'Hello There', tags: ['hi', 'hello', 'hey', 'wave'] },
  { id: 'ujrj9aoOdNvXO', title: 'Hey Friend', tags: ['hi', 'hello', 'hey', 'greet'] },
  { id: '6MYnYnaiq9SaGt8AWD', title: 'Hiya', tags: ['hi', 'hello', 'hey', 'cute'] },
  { id: 'kBZ212yGzFaxgkSIKW', title: 'Welcome Hi', tags: ['hi', 'hello', 'hey', 'wave'] },

  // LOL / Funny
  { id: '7tjJBKwoDBxoj6nsrV', title: 'LOL Laugh', tags: ['lol', 'lmao', 'funny', 'laugh', 'trending'] },
  { id: 'hVlZnRT6QW1DeYj6We', title: 'Haha Crying', tags: ['lol', 'lmao', 'funny', 'laugh'] },
  { id: 'kGj6vqywxz5VU3rjNl', title: 'Rofl', tags: ['lol', 'lmao', 'funny', 'laugh'] },
  { id: 'l4FGmYUcMoATdaYH6', title: 'Laughing', tags: ['lol', 'lmao', 'funny', 'happy'] },
  { id: 'xUA7b2eF4mLdGLBWfK', title: 'Giggle', tags: ['lol', 'lmao', 'funny', 'cute'] },

  // Love / Hearts
  { id: 'qx3d4enif4rw3t5eng', title: 'Love Heart', tags: ['love', 'heart', 'cute', 'trending'] },
  { id: 'l4FGzFhVty9Q0cyxq', title: 'Floating Hearts', tags: ['love', 'heart', 'kiss', 'cute'] },
  { id: 'C7LXyEeDHGv6Jqewsh', title: 'Sending Love', tags: ['love', 'heart', 'sweet'] },
  { id: 'nlNg4qMR8k5mi04fup', title: 'Heart Sparkle', tags: ['love', 'heart', 'sparkle'] },
  { id: 'fvN5KrNcKKUyX7hNIA', title: 'Much Love', tags: ['love', 'heart', 'cute'] },

  // Fire / Hype
  { id: 'ibjOWWBs0x3c2syap9', title: 'Fire Flame', tags: ['fire', 'lit', 'hype', 'hot', 'trending'] },
  { id: 'KflcaLITUDCUZoL97z', title: 'Lit Fire', tags: ['fire', 'lit', 'hype', 'cool'] },
  { id: '6Hsdux8Igg5ig', title: 'Blazing', tags: ['fire', 'lit', 'hype', 'hot'] },
  { id: '4Z9p5iVHTo3CWW1Lpe', title: 'On Fire', tags: ['fire', 'lit', 'hype', 'energy'] },
  { id: 'RMBAIfEfulAqgdyWH6', title: 'Flame On', tags: ['fire', 'lit', 'hype', 'wow'] },

  // Dance / Party
  { id: 'x5lIgu2DDtI5IzdtUg', title: 'Dance Vibe', tags: ['dance', 'party', 'music', 'vibing', 'trending'] },
  { id: '4N03E1kvkFuGtcwlZP', title: 'Grooving', tags: ['dance', 'party', 'music', 'vibing'] },
  { id: 'h7deZA51Ru9pwzlz0C', title: 'Party Moves', tags: ['dance', 'party', 'happy', 'vibing'] },
  { id: 'oNngkg8JedLXxrLWBi', title: 'Happy Dance', tags: ['dance', 'party', 'celebrate'] },
  { id: 'KGjlaKWM8L2yoLrky6', title: 'Boogie', tags: ['dance', 'party', 'music', 'fun'] },

  // Wow / Shocked
  { id: 'bgIUovWAtVaNixyZG2', title: 'Wow Pop', tags: ['wow', 'omg', 'shocked', 'amazed', 'trending'] },
  { id: '2LbqS0BUIGtjHgCFzx', title: 'OMG', tags: ['wow', 'omg', 'shocked', 'surprised'] },
  { id: 'xUA7b7SQ5ZhNrIJAMo', title: 'Whoa', tags: ['wow', 'omg', 'shocked', 'cool'] },
  { id: 'Q1OdBWGGvcizt37BVP', title: 'Sparkle Wow', tags: ['wow', 'omg', 'amazed', 'nice'] },
  { id: 'RkMZE0Qca2UzLnsuFV', title: 'Mind Blown', tags: ['wow', 'omg', 'shocked', 'mind'] },
].map((s) => ({
  id: s.id,
  title: s.title,
  tags: s.tags,
  previewUrl: `https://media.giphy.com/media/${s.id}/200w.gif`,
  url: `https://media.giphy.com/media/${s.id}/200w.gif`,
}));

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();
  const apiKey = process.env.GIPHY_API_KEY;

  if (apiKey) {
    try {
      const endpoint = q
        ? `https://api.giphy.com/v1/stickers/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`
        : `https://api.giphy.com/v1/stickers/trending?api_key=${encodeURIComponent(apiKey)}&limit=24&rating=pg-13`;

      const res = await fetch(endpoint, { next: { revalidate: 60 } });
      if (res.ok) {
        const payload = await res.json();
        const stickers = (payload.data || [])
          .map((item) => ({
            id: item.id,
            title: item.title || 'Sticker',
            previewUrl: item.images?.fixed_width_small?.url || item.images?.fixed_width?.url,
            url: item.images?.fixed_width?.url || item.images?.downsized?.url,
          }))
          .filter((s) => s.previewUrl && s.url);

        return NextResponse.json({ stickers, source: 'giphy' });
      }
    } catch (err) {
      console.error('[api/stickers] GIPHY request failed, using starter pack:', err);
    }
  }

  const query = q.toLowerCase();
  const filtered = !query
    ? STARTER_STICKERS.filter((s) => s.tags.includes('trending'))
    : STARTER_STICKERS.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.tags.some((t) => t.includes(query))
      );

  const result = filtered.length > 0 ? filtered : STARTER_STICKERS.slice(0, 18);
  return NextResponse.json({
    stickers: result.map(({ id, title, previewUrl, url }) => ({ id, title, previewUrl, url })),
    source: 'starter',
  });
}
