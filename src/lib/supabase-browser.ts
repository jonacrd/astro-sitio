// Importar configuración centralizada
import { supabase } from './supabase-config';

// Verificar conexión inicial
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.warn('⚠️ Error al obtener sesión inicial:', error.message);
  } else if (session) {
    console.log('✅ Sesión encontrada:', session.user.email);
  } else {
    console.log('ℹ️ No hay sesión activa');
  }
});

// Exportar tanto como default como named export
export default supabase;
export { supabase };
