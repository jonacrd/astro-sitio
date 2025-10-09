/**
 * Utilidades para gestionar avatares de usuario
 */

export interface UserProfile {
  avatar_url?: string | null;
  is_seller?: boolean;
  gender?: string | null;
  raw_user_meta_data?: {
    avatar_url?: string;
    picture?: string;
    gender?: string;
  };
}

/**
 * Obtiene la URL del avatar apropiado para un usuario
 * 
 * Prioridad:
 * 1. Avatar personalizado del usuario (avatar_url)
 * 2. Avatar de Google (raw_user_meta_data.picture)
 * 3. Avatar por defecto según:
 *    - Vendedor: store-icon.png
 *    - Hombre: male-icon.png
 *    - Mujer: female-icon.png
 *    - Default: male-icon.png
 */
export function getUserAvatar(profile: UserProfile | null | undefined): string {
  // Si no hay perfil, usar icono masculino por defecto
  if (!profile) {
    return '/male-icon.png';
  }

  // 1. Avatar personalizado del usuario
  if (profile.avatar_url && profile.avatar_url.trim() !== '') {
    return profile.avatar_url;
  }

  // 2. Avatar de Google (si inició sesión con Google)
  if (profile.raw_user_meta_data?.picture) {
    return profile.raw_user_meta_data.picture;
  }

  if (profile.raw_user_meta_data?.avatar_url) {
    return profile.raw_user_meta_data.avatar_url;
  }

  // 3. Avatar por defecto según tipo de usuario
  
  // Si es vendedor → store-icon
  if (profile.is_seller) {
    return '/store-icon.png';
  }

  // Si tiene género definido
  const gender = profile.gender || profile.raw_user_meta_data?.gender;
  
  if (gender) {
    const genderLower = gender.toLowerCase();
    
    // Femenino
    if (genderLower === 'female' || 
        genderLower === 'f' || 
        genderLower === 'mujer' || 
        genderLower === 'femenino') {
      return '/female-icon.png';
    }
    
    // Masculino
    if (genderLower === 'male' || 
        genderLower === 'm' || 
        genderLower === 'hombre' || 
        genderLower === 'masculino') {
      return '/male-icon.png';
    }
  }

  // Default: masculino
  return '/male-icon.png';
}

/**
 * Obtiene las iniciales del nombre para avatar fallback
 */
export function getUserInitials(name?: string | null): string {
  if (!name || name.trim() === '') {
    return '?';
  }

  const parts = name.trim().split(' ');
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Componente de imagen con fallback para avatares
 */
export function getAvatarImageProps(profile: UserProfile | null | undefined) {
  const src = getUserAvatar(profile);
  const alt = profile?.is_seller 
    ? 'Tienda' 
    : profile?.gender === 'female' 
      ? 'Usuario' 
      : 'Usuario';

  return {
    src,
    alt,
    onError: (e: any) => {
      // Si falla la carga, usar avatar por defecto
      const target = e.target as HTMLImageElement;
      if (target.src !== '/male-icon.png' && 
          target.src !== '/female-icon.png' && 
          target.src !== '/store-icon.png') {
        target.src = getUserAvatar(null);
      }
    }
  };
}




