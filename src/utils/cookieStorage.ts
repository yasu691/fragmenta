export class CookieStorage {
  static setItem(key: string, value: string, options?: {
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  }): void {
    const defaults = {
      maxAge: 365 * 24 * 60 * 60,
      secure: true,
      sameSite: 'strict' as const,
    };
    
    const opts = { ...defaults, ...options };
    
    let cookieString = `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    cookieString += `; max-age=${opts.maxAge}`;
    cookieString += `; path=/`;
    
    if (opts.secure && window.location.protocol === 'https:') {
      cookieString += `; secure`;
    }
    
    cookieString += `; samesite=${opts.sameSite}`;
    
    document.cookie = cookieString;
  }

  static getItem(key: string): string | null {
    const name = encodeURIComponent(key) + '=';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name)) {
        return decodeURIComponent(cookie.substring(name.length));
      }
    }
    
    return null;
  }

  static removeItem(key: string): void {
    document.cookie = `${encodeURIComponent(key)}=; max-age=0; path=/`;
  }
}
