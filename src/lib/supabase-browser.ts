// Importar configuración centralizada
import { supabase } from './supabase-config';

// Verificar conexión inicial solo si supabase está disponible
if (supabase && typeof window !== 'undefined') {
  supabase.auth.getSession().then(({ data: { session }, error }) => {
    if (error) {
      console.warn('⚠️ Error al obtener sesión inicial:', error.message);
    } else if (session) {
      console.log('✅ Sesión encontrada:', session.user.email);
    } else {
      console.log('ℹ️ No hay sesión activa');
    }
  }).catch((error) => {
    console.warn('⚠️ Error verificando sesión inicial:', error);
  });
}

// Exportar tanto como default como named export
export default supabase;
export { supabase };
