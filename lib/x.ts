/**
 * X (Twitter) API client for fetching bookmarks
 * Handles OAuth authentication and pagination
 */

export interface XBookmark {
  id: string
  text: string
  authorId: string
  username: string
  created_at: string
}

export interface XUser {
  id: string
  username: string
  name: string
}

/**
 * Fetches bookmarks for a user from X API
 * Handles pagination up to 800 items maximum
 * Returns normalized bookmark data
 */
export async function fetchBookmarks(
  accessToken: string,
  userId: string,
  maxItems: number = 800
): Promise<XBookmark[]> {
  const bookmarks: XBookmark[] = []
  let nextToken: string | undefined
  
  const baseUrl = 'https://api.twitter.com/2/users'
  const tweetFields = 'created_at,author_id'
  const userFields = 'name,username'
  const expansions = 'author_id'
  
  while (bookmarks.length < maxItems) {
    const url = new URL(`${baseUrl}/${userId}/bookmarks`)
    url.searchParams.set('tweet.fields', tweetFields)
    url.searchParams.set('user.fields', userFields)
    url.searchParams.set('expansions', expansions)
    url.searchParams.set('max_results', '100') // Max per request
    
    if (nextToken) {
      url.searchParams.set('pagination_token', nextToken)
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`X API error: ${response.status} ${error}`)
    }
    
    const data = await response.json()
    
    // Extract users for username mapping
    const users = new Map<string, XUser>()
    if (data.includes?.users) {
      for (const user of data.includes.users) {
        users.set(user.id, user)
      }
    }
    
    // Process tweets
    if (data.data) {
      for (const tweet of data.data) {
        const user = users.get(tweet.author_id)
        if (user) {
          bookmarks.push({
            id: tweet.id,
            text: tweet.text,
            authorId: tweet.author_id,
            username: user.username,
            created_at: tweet.created_at
          })
        }
      }
    }
    
    // Check if we have more pages
    nextToken = data.meta?.next_token
    if (!nextToken) {
      break
    }
    
    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return bookmarks.slice(0, maxItems)
}

/**
 * Fetches full tweet details for specific tweet IDs
 * Used to hydrate tweet content when sending emails
 */
export async function fetchTweetDetails(
  accessToken: string,
  tweetIds: string[]
): Promise<XBookmark[]> {
  if (tweetIds.length === 0) return []
  
  const url = new URL('https://api.twitter.com/2/tweets')
  url.searchParams.set('ids', tweetIds.join(','))
  url.searchParams.set('tweet.fields', 'created_at,author_id')
  url.searchParams.set('user.fields', 'name,username')
  url.searchParams.set('expansions', 'author_id')
  
  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`X API error: ${response.status} ${error}`)
  }
  
  const data = await response.json()
  
  // Extract users for username mapping
  const users = new Map<string, XUser>()
  if (data.includes?.users) {
    for (const user of data.includes.users) {
      users.set(user.id, user)
    }
  }
  
  // Process tweets
  const tweets: XBookmark[] = []
  if (data.data) {
    for (const tweet of data.data) {
      const user = users.get(tweet.author_id)
      if (user) {
        tweets.push({
          id: tweet.id,
          text: tweet.text,
          authorId: tweet.author_id,
          username: user.username,
          created_at: tweet.created_at
        })
      }
    }
  }
  
  return tweets
}

/**
 * Exchanges OAuth authorization code for access token
 */
export async function exchangeCodeForToken(code: string, codeVerifier: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}> {
  const response = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(
        `${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`
      ).toString('base64')}`
    },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: process.env.X_CLIENT_ID!,
      redirect_uri: process.env.X_REDIRECT_URI!,
      code_verifier: codeVerifier
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OAuth token exchange failed: ${response.status} ${error}`)
  }
  
  return response.json()
}

/**
 * Gets user info from X API using access token
 */
export async function getUserInfo(accessToken: string): Promise<{
  id: string
  username: string
  name: string
  email?: string
}> {
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`X API user info error: ${response.status} ${error}`)
  }
  
  const data = await response.json()
  return data.data
}
