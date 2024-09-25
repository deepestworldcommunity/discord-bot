import { username, password } from './config.js'

export async function getAuthToken() {
  let response = await fetch('https://deepestworld.com/login')
  const text = await response.text()
  const token =
    text.match(/name="_csrf_token" value="(?<token>[^"]*)"/)?.groups?.token ??
    ''
  let cookie =
    response.headers.get('set-cookie')?.match(/^(?<cookie>[^=;]*=[^;]*)/)
      ?.groups?.cookie ?? ''

  if (!response.ok || !token || !cookie) {
    throw new Error('Could not get CSRF token from login page')
  }

  const data = new URLSearchParams()
  data.append('_username', username)
  data.append('_password', password)
  data.append('_target_path', '/default-login-redirect?s=0')
  data.append('_csrf_token', token)
  response = await fetch(
    new Request('https://deepestworld.com/login', { redirect: 'manual' }),
    {
      method: 'post',
      body: data,
      headers: {
        cookie,
      },
    },
  )

  cookie =
    response.headers.get('set-cookie')?.match(/^(?<cookie>[^=;]*=[^;]*)/)
      ?.groups?.cookie ?? ''

  if (response.status !== 302 || !cookie) {
    throw new Error('Could not login and get cookie')
  }

  response = await fetch('https://deepestworld.com/ws-auth-token', {
    headers: {
      cookie,
    },
  })

  /** @type {string | undefined} */
  let authToken
  try {
    const json = await response.json()
    authToken = json.token
  } catch (err) {
    throw new Error('Could not retrieve auth token', { cause: err })
  }

  if (!response.ok || !authToken || typeof authToken !== 'string') {
    throw new Error('Could not retrieve auth token')
  }

  return authToken
}
