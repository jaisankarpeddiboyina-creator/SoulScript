import PocketBase from 'pocketbase';

const PB_URL = import.meta.env.VITE_POCKETBASE_URL;
const pb = new PocketBase(PB_URL || 'http://127.0.0.1:8090');

export const isPocketBaseHealthy = async () => {
  if (!PB_URL) return false;
  try {
    await pb.health.check();
    return true;
  } catch (err) {
    return false;
  }
};

export const initPocketBase = async () => {
  // If you need auth, you can add it here.
  // For public read/write (if rules allow), no auth needed.
  return pb;
};

export const getQuotesByCategory = async (category: string) => {
  return await pb.collection('quotes').getList(1, 50, {
    filter: `category = "${category}"`,
    sort: '-created',
  });
};

export const getQuotesByAuthor = async (authorSlug: string) => {
  return await pb.collection('quotes').getList(1, 50, {
    filter: `authorSlug = "${authorSlug}"`,
    sort: '-created',
  });
};

export const getAllAuthors = async () => {
  // PocketBase doesn't have a direct "distinct authors" endpoint easily without grouping
  // But we can fetch all records and group, or better, if the collection is large, 
  // we might need an "authors" collection. 
  // For now, let's fetch a list and group on client or use a custom filter.
  // Actually, the requirement says "Every unique author from quotable.io automatically gets their own collection card"
  // and "sorted by quote count".
  
  const records = await pb.collection('quotes').getFullList({
    sort: '-created',
  });

  const authorsMap: Record<string, { name: string, slug: string, count: number, firstImage: string }> = {};

  records.forEach(r => {
    if (!authorsMap[r.authorSlug]) {
      authorsMap[r.authorSlug] = {
        name: r.author,
        slug: r.authorSlug,
        count: 0,
        firstImage: r.imageUrl
      };
    }
    authorsMap[r.authorSlug].count++;
  });

  return Object.values(authorsMap).sort((a, b) => b.count - a.count);
};

export const saveQuote = async (quoteData: any) => {
  return await pb.collection('quotes').create(quoteData);
};

export const checkQuoteExists = async (quoteId: string) => {
  try {
    await pb.collection('quotes').getFirstListItem(`quoteId = "${quoteId}"`);
    return true;
  } catch (err) {
    return false;
  }
};

export default pb;
