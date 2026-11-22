'use client';

import { v4 as uuidv4 } from 'uuid';
import { getDefaultAvatarForId, isValidAvatarId } from '@/lib/avatars';

export function getIdentity() {
  if (typeof window === 'undefined') {
    return { id: '', name: 'Anon', isAnon: true, avatar: 'cloud' };
  }

  let anonId = localStorage.getItem('ct_anon_id');
  if (!anonId) {
    anonId = `anon_${uuidv4()}`;
    localStorage.setItem('ct_anon_id', anonId);
  }

  let anonName = localStorage.getItem('ct_anon_name');
  if (!anonName) {
    const code = anonId.replace(/^anon_/, '').split('-')[0].slice(0, 4).toUpperCase();
    anonName = `Anon-${code}`;
    localStorage.setItem('ct_anon_name', anonName);
  }

  try {
    document.cookie = `ct_anon_id=${encodeURIComponent(anonId)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}

  const savedAvatar = localStorage.getItem('ct_avatar');

  const userStr = localStorage.getItem('ct_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id && user.username) {
        const avatar = isValidAvatarId(user.avatar)
          ? user.avatar
          : isValidAvatarId(savedAvatar)
            ? savedAvatar
            : getDefaultAvatarForId(user.id);
        return { id: user.id, name: user.username, isAnon: false, avatar };
      }
    } catch {}
  }

  const avatar = isValidAvatarId(savedAvatar) ? savedAvatar : getDefaultAvatarForId(anonId);
  return { id: anonId, name: anonName, isAnon: true, avatar };
}

export function setSavedAvatar(avatarId) {
  if (typeof window === 'undefined' || !isValidAvatarId(avatarId)) return;
  localStorage.setItem('ct_avatar', avatarId);

  const userStr = localStorage.getItem('ct_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        user.avatar = avatarId;
        localStorage.setItem('ct_user', JSON.stringify(user));
      }
    } catch {}
  }

  window.dispatchEvent(new Event('auth_change'));
}

export function getDmRoomId(idA, idB) {
  return [String(idA), String(idB)].sort().join('__dm__');
}
