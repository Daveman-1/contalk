import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Verified live GIPHY CDN GIFs used when GIPHY_API_KEY is not configured
const STARTER_GIFS = [
  { id: '3o7abKhOpu0NwenH3O', title: 'Hi Wave', tags: ['hi', 'hello', 'hey', 'wave', 'trending'] },
  { id: 'ASd0Ukj0y3qMM', title: 'Hello Friend', tags: ['hi', 'hello', 'hey', 'cute'] },
  { id: 'Cmr1OMJ2FN0B2', title: 'Hey There', tags: ['hi', 'hello', 'wave', 'greetings'] },
  { id: 'l0MYt5jPR6QX5pnqM', title: 'Laughing Hard', tags: ['lol', 'funny', 'lmao', 'laugh', 'trending'] },
  { id: 'BPJmthQ3YRwD6QqcVD', title: 'Cheers Celebrate', tags: ['party', 'hype', 'cheers', 'celebrate', 'trending'] },
  { id: 'xT0xeJpnrWC4XWblEk', title: 'Mind Blown', tags: ['shocked', 'wow', 'mind blown', 'omg', 'trending'] },
  { id: 'l3q2K5jinAlChoCLS', title: 'Wait What Blink', tags: ['shocked', 'confused', 'what', 'sus', 'trending'] },
  { id: 'g9582DNuQppxC', title: 'Applause Clap', tags: ['clap', 'respect', 'hype', 'bravo', 'trending'] },
  { id: '111ebonMs90YLu', title: 'Thumbs Up', tags: ['yes', 'ok', 'bet', 'cool', 'good', 'trending'] },
  { id: '26u4cqiYI30juCOGY', title: 'Winner Hype', tags: ['hype', 'win', 'fire', 'party', 'yes'] },
  { id: 'l0HlvtIPzPdt2usKs', title: 'Side Eye', tags: ['sus', 'hmm', 'awkward', 'really'] },
  { id: '3oriO0OEd9QIDdllqo', title: 'Cute Cat Love', tags: ['love', 'cute', 'cat', 'heart', 'trending'] },
  { id: 'MDJ9IbxxvDUQM', title: 'Sending Love', tags: ['love', 'kiss', 'heart', 'cute'] },
  { id: 'l0amJzVHIAfl7jMDos', title: 'Dancing Vibe', tags: ['dance', 'party', 'vibing', 'music', 'hype'] },
  { id: 'blSTtZehjAZ8I', title: 'Party Dance', tags: ['dance', 'music', 'vibing', 'party', 'trending'] },
  { id: '3ohzdIuqJoo8QdKlnW', title: 'Yes Lets Go', tags: ['yes', 'hype', 'fire', 'excited', 'lets go'] },
  { id: '26gsjCZpPolPr3sBy', title: 'Thank You', tags: ['thanks', 'love', 'appreciate', 'hi'] },
  { id: '3o7TKMt1VVNkHV2PaE', title: 'OMG Shocked', tags: ['shocked', 'omg', 'wow', 'funny'] },
  { id: 'd2lcHJTG5Tscg', title: 'Crying Sad', tags: ['sad', 'cry', 'lol', 'dead'] },
  { id: 'Ju7l5y9osyymQ', title: 'Vibing Classic', tags: ['dance', 'music', 'funny', 'vibing', 'cool'] },
].map((g) => ({
  id: g.id,
  title: g.title,
  tags: g.tags,
  previewUrl: `https://media.giphy.com/media/${g.id}/200w.gif`,
  url: `https://media.giphy.com/media/${g.id}/giphy.gif`,
}));

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get('q') || '').trim();
  const apiKey = process.env.GIPHY_API_KEY;

  if (apiKey) {
    try {
      const endpoint = q
        ? `https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&limit=24&rating=pg-13`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${encodeURIComponent(apiKey)}&limit=24&rating=pg-13`;

      const res = await fetch(endpoint, { next: { revalidate: 60 } });
      if (res.ok) {
        const payload = await res.json();
        const gifs = (payload.data || [])
          .map((item) => ({
            id: item.id,
            title: item.title || 'GIF',
            previewUrl: item.images?.fixed_width_small?.url || item.images?.fixed_width?.url,
            url: item.images?.fixed_width?.url || item.images?.downsized?.url,
          }))
          .filter((g) => g.previewUrl && g.url);

        return NextResponse.json({ gifs, source: 'giphy' });
      }
    } catch (err) {
      console.error('[api/gifs] GIPHY request failed, using starter pack:', err);
    }
  }

  const query = q.toLowerCase();
  const filtered = !query
    ? STARTER_GIFS
    : STARTER_GIFS.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          g.tags.some((t) => t.includes(query))
      );

  return NextResponse.json({
    gifs: (filtered.length > 0 ? filtered : STARTER_GIFS).map(({ id, title, previewUrl, url }) => ({
      id,
      title,
      previewUrl,
      url,
    })),
    source: 'starter',
  });
}
