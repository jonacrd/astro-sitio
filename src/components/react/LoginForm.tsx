import React, { useState } from 'react';
import { supabase } from '../../lib/supabase-browser';

interface LoginFormProps {
  onLoginSuccess: (user: any) => void;
  onClose: () => void;
}

export default function LoginForm({ onLoginSuccess, onClose }: LoginFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
     setError(null);
     setSuccess(false);

     try {
       console.log('🔐 Iniciando sesión...');
       console.log('📧 Email:', email);
       console.log('🔑 Password length:', password.length);
       
       const { data, error } = await supabase.auth.signInWithPassword({
         email,
         password,
       });

      if (error) {
        console.error('❌ Error en login:', error.message);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('✅ Login exitoso:', data.user.email);
        setSuccess(true);
        
        // Mostrar notificación de éxito
        if (typeof window !== 'undefined') {
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
          notification.innerHTML = `
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              ¡Inicio de sesión exitoso!
            </div>
          `;
          
          document.body.appendChild(notification);
          
          // Animar la notificación
          setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
          }, 100);
          
          // Remover la notificación después de 3 segundos
          setTimeout(() => {
            notification.classList.remove('translate-x-0');
            notification.classList.add('translate-x-full');
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }, 3000);
        }

        // Cerrar el modal después de un breve delay
        setTimeout(() => {
          onClose();
          onLoginSuccess(data.user);
          
          // Disparar evento personalizado para actualizar la UI
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('auth-state-changed', {
              detail: { user: data.user, type: 'login' }
            }));
          }
        }, 1500);

      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setError('Error inesperado al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

     try {
       console.log('📝 Registrando usuario...');
       console.log('📧 Email:', email);
       console.log('👤 Nombre:', name);
       console.log('🔑 Password length:', password.length);
       
       const { data, error } = await supabase.auth.signUp({
         email,
         password,
         options: {
           emailRedirectTo: `${window.location.origin}/complete-profile`,
           data: {
             name: name.trim(),
             last_name: lastName.trim() || null,
             address: address.trim() || null
           }
         }
       });

      if (error) {
        console.error('❌ Error en registro:', error.message);
        setError(error.message);
        setLoading(false);
        return;
      }

       if (data.user) {
         console.log('✅ Registro exitoso:', data.user.email);
         console.log('🆔 User ID:', data.user.id);
         console.log('📧 Email confirmed:', data.user.email_confirmed_at);
         console.log('🔐 User confirmed:', data.user.confirmed_at);
         
         // Guardar perfil en la tabla profiles
         try {
           console.log('💾 Guardando perfil en BD...');
           const { error: profileError } = await supabase.from('profiles').upsert({
             id: data.user.id,
             name: name.trim()
             // Removido last_name y address temporalmente hasta que se agreguen las columnas
           });
           
           if (profileError) {
             console.error('❌ Error guardando perfil:', profileError);
             console.error('❌ Profile error details:', profileError.message);
           } else {
             console.log('✅ Perfil guardado exitosamente');
           }
         } catch (profileErr) {
           console.error('❌ Error inesperado guardando perfil:', profileErr);
         }
        
        setSuccess(true);
        
        // Marcar que el usuario acaba de registrarse para mostrar el modal de notificaciones
        if (typeof window !== 'undefined') {
          localStorage.setItem('just_registered', 'true');
        }
        
        // Mostrar notificación de éxito
        if (typeof window !== 'undefined') {
          const notification = document.createElement('div');
          notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
          notification.innerHTML = `
            <div class="flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              ¡Registro exitoso! Revisa tu email para confirmar.
            </div>
          `;
          
          document.body.appendChild(notification);
          
          setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
          }, 100);
          
          setTimeout(() => {
            notification.classList.remove('translate-x-0');
            notification.classList.add('translate-x-full');
            setTimeout(() => {
              document.body.removeChild(notification);
            }, 300);
          }, 3000);
        }

         // Mostrar opción de login inmediato
         setTimeout(() => {
           // Intentar login automático si el usuario no necesita verificación
           if (data.user && !data.user.email_confirmed_at) {
             // Usuario registrado pero no verificado - permitir uso inmediato
             console.log('✅ Usuario registrado, permitiendo acceso inmediato');
             onClose();
             onLoginSuccess(data.user);
             
             if (typeof window !== 'undefined') {
               window.dispatchEvent(new CustomEvent('auth-state-changed', {
                 detail: { user: data.user, type: 'register' }
               }));
             }
           } else {
             // Usuario verificado - login normal
             onClose();
             onLoginSuccess(data.user);
             
             if (typeof window !== 'undefined') {
               window.dispatchEvent(new CustomEvent('auth-state-changed', {
                 detail: { user: data.user, type: 'register' }
               }));
             }
           }
         }, 1500);

      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);
      setError('Error inesperado al registrarse');
    } finally {
      setLoading(false);
     }
   };

   const handleResendVerification = async () => {
     if (!email.trim()) {
       setError('Por favor ingresa tu email primero');
       return;
     }

     setResendLoading(true);
     setError(null);

     try {
       console.log('📧 Reenviando correo de verificación...');
       
       const { error } = await supabase.auth.resend({
         type: 'signup',
         email: email.trim(),
         options: {
           emailRedirectTo: `${window.location.origin}/complete-profile`
         }
       });

       if (error) {
         console.error('❌ Error reenviando correo:', error.message);
         setError(error.message);
         return;
       }

       console.log('✅ Correo reenviado exitosamente');
       
       // Mostrar notificación de éxito
       if (typeof window !== 'undefined') {
         const notification = document.createElement('div');
         notification.className = 'fixed top-4 right-4 bg-blue-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
         notification.innerHTML = `
           <div class="flex items-center">
             <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
             </svg>
             ¡Correo de verificación reenviado!
           </div>
         `;
         
         document.body.appendChild(notification);
         
         setTimeout(() => {
           notification.classList.remove('translate-x-full');
           notification.classList.add('translate-x-0');
         }, 100);
         
         setTimeout(() => {
           notification.classList.remove('translate-x-0');
           notification.classList.add('translate-x-full');
           setTimeout(() => {
             document.body.removeChild(notification);
           }, 300);
         }, 3000);
       }

     } catch (err) {
       console.error('❌ Error inesperado:', err);
       setError('Error inesperado al reenviar correo');
     } finally {
       setResendLoading(false);
     }
   };

   const handlePasswordReset = async () => {
     if (!email.trim()) {
       setError('Por favor ingresa tu email primero');
       return;
     }

     setResetLoading(true);
     setError(null);

     try {
       console.log('🔑 Enviando correo de restablecimiento de contraseña...');
       
       const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
         redirectTo: `${window.location.origin}/reset-password`
       });

       if (error) {
         console.error('❌ Error enviando correo de restablecimiento:', error.message);
         setError(error.message);
         return;
       }

       console.log('✅ Correo de restablecimiento enviado exitosamente');
       
       // Mostrar notificación de éxito
       if (typeof window !== 'undefined') {
         const notification = document.createElement('div');
         notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
         notification.innerHTML = `
           <div class="flex items-center">
             <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
             </svg>
             ¡Correo de restablecimiento enviado! Revisa tu email.
           </div>
         `;
         
         document.body.appendChild(notification);
         
         setTimeout(() => {
           notification.classList.remove('translate-x-full');
           notification.classList.add('translate-x-0');
         }, 100);
         
         setTimeout(() => {
           notification.classList.remove('translate-x-0');
           notification.classList.add('translate-x-full');
           setTimeout(() => {
             document.body.removeChild(notification);
           }, 300);
         }, 5000);
       }

     } catch (err) {
       console.error('❌ Error inesperado:', err);
       setError('Error inesperado al enviar correo de restablecimiento');
     } finally {
       setResetLoading(false);
     }
   };

   const handleGoogleLogin = async () => {
     setLoading(true);
     setError(null);
     setSuccess(false);

     try {
       console.log('🔐 Iniciando sesión con Google...');
       
       const { data, error } = await supabase.auth.signInWithOAuth({
         provider: 'google',
         options: {
           redirectTo: `${window.location.origin}/`
         }
       });

       if (error) {
         console.error('❌ Error en login con Google:', error.message);
         setError(error.message);
         setLoading(false);
         return;
       }

       console.log('✅ Redirigiendo a Google...');
       
     } catch (err) {
       console.error('❌ Error inesperado:', err);
       setError('Error inesperado al iniciar sesión con Google');
     } finally {
       setLoading(false);
     }
   };

   return (
    <div>
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            ¡Operación exitosa!
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Toggle entre Login y Registro */}
      <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'login' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'register' 
              ? 'bg-white text-green-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Registrarse
        </button>
      </div>

      <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
        {/* Campos para Registro */}
        {mode === 'register' && (
          <>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Tu apellido (opcional)"
              />
            </div>
          </>
        )}

        {/* Email - siempre presente */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
              mode === 'login' ? 'focus:ring-blue-500' : 'focus:ring-green-500'
            }`}
            placeholder="tu@email.com"
          />
        </div>

        {/* Contraseña - siempre presente */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña * {mode === 'register' && <span className="text-xs text-gray-500">(mínimo 8 caracteres)</span>}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === 'register' ? 8 : undefined}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
              mode === 'login' ? 'focus:ring-blue-500' : 'focus:ring-green-500'
            }`}
            placeholder="••••••••"
          />
        </div>

        {/* Dirección - solo para registro */}
        {mode === 'register' && (
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección de entrega
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Tu dirección predeterminada (opcional)"
            />
          </div>
        )}

        {/* Botón principal */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            mode === 'login' 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {loading 
            ? (mode === 'login' ? 'Iniciando...' : 'Registrando...') 
            : (mode === 'login' ? 'Iniciar Sesión' : 'Registrarse')
          }
         </button>

         {/* Botón de Google */}
         <div className="mt-4">
           <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-gray-300" />
             </div>
             <div className="relative flex justify-center text-sm">
               <span className="px-2 bg-white text-gray-500">O continúa con</span>
             </div>
           </div>
           
           <button
             type="button"
             onClick={handleGoogleLogin}
             disabled={loading}
             className="mt-4 w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
               <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
               <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
               <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
               <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
             </svg>
             {loading ? 'Conectando...' : 'Continuar con Google'}
           </button>
         </div>
       </form>

       {/* Botón para reenviar correo de verificación */}
       {mode === 'register' && (
         <div className="mt-4 pt-4 border-t border-gray-200">
           <p className="text-sm text-gray-600 mb-3">
             ¿No recibiste el correo de verificación?
           </p>
           <button
             type="button"
             onClick={handleResendVerification}
             disabled={resendLoading || !email.trim()}
             className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
           >
             {resendLoading ? 'Reenviando...' : 'Reenviar correo de verificación'}
           </button>
         </div>
       )}

       {/* Botón para restablecer contraseña */}
       {mode === 'login' && (
         <div className="mt-4 pt-4 border-t border-gray-200">
           <p className="text-sm text-gray-600 mb-3">
             ¿Olvidaste tu contraseña?
           </p>
           <button
             type="button"
             onClick={handlePasswordReset}
             disabled={resetLoading || !email.trim()}
             className="w-full py-2 px-4 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
           >
             {resetLoading ? 'Enviando...' : 'Restablecer contraseña'}
           </button>
         </div>
       )}
     </div>
   );
 }
