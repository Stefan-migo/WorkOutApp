import { AwsClient } from 'aws4fetch'

export function getR2Bucket() {
  const { R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = process.env
  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null

  const client = new AwsClient({
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  })
  const endpoint = `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}`

  return {
    async sign(key: string, method: 'GET' | 'PUT', headers?: HeadersInit) {
      const url = new URL(`${endpoint}/${key}`)
      url.searchParams.set('X-Amz-Expires', method === 'PUT' ? '300' : '60')
      const signed = await client.sign(url, {
        method,
        headers,
        aws: { signQuery: true, allHeaders: true },
      })
      return signed.url
    },
  }
}
