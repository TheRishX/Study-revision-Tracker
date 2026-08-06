const PSALMIFY_POSTS_ENDPOINT = 'https://public-api.wordpress.com/rest/v1.1/sites/psalmify.wordpress.com/posts/?number=12';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(PSALMIFY_POSTS_ENDPOINT);
    if (!response.ok) throw new Error(`Psalmify API responded with ${response.status}`);
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600');
    return res.status(200).json(data);
  } catch (error) {
    console.error('Unable to fetch Psalmify posts:', error);
    return res.status(502).json({ error: 'Unable to load Psalmify posts' });
  }
}
