import net from 'node:net';

function isPrivateIpv4(ip) {
  const octets = ip.split('.').map(Number);
  if (octets.length !== 4) return false;
  return octets[0] === 10 || octets[0] === 127 ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 169 && octets[1] === 254) || octets[0] === 0;
}

export function validateStreamUrl(raw, allowPrivate = true) {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http(s) stream URLs are allowed');
  if (url.username || url.password) throw new Error('Credentials in stream URLs are not allowed');
  if (!allowPrivate) {
    const host = url.hostname.replace(/^\[|\]$/g, '');
    if (host === 'localhost' || (net.isIP(host) === 4 && isPrivateIpv4(host)) || (net.isIP(host) === 6 && (host === '::1' || host.startsWith('fc') || host.startsWith('fd')))) {
      throw new Error('Private/loopback stream URLs are disabled');
    }
  }
  return url.toString();
}
