const getHeaderValue = (headers, name) => {
  const value = headers?.[name] || headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
};

export const requireDebugSecret = (req, res) => {
  const expectedSecret = process.env.DEBUG_SECRET?.trim();

  if (!expectedSecret) {
    res.status(404).json({ success: false, error: 'Not found.' });
    return false;
  }

  const authorization = getHeaderValue(req.headers, 'authorization') || '';
  const bearerToken = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';
  const headerToken = getHeaderValue(req.headers, 'x-debug-token') || '';
  const queryToken = req.query?.debugToken || req.query?.token || '';
  const providedToken = String(headerToken || bearerToken || queryToken).trim();

  if (providedToken !== expectedSecret) {
    res.status(403).json({ success: false, error: 'Forbidden.' });
    return false;
  }

  return true;
};
