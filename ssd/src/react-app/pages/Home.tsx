import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useSupabaseAuth } from "../auth/SupabaseAuthProvider";
import { supabase } from "../supabaseClient";
import { Scissors, Mail, Lock, AlertCircle } from 'lucide-react';
import LoadingSpinner from "../components/LoadingSpinner";

export default function HomePage() {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Apenas lógica de Login (Sign In)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // O SupabaseAuthProvider irá detetar o login e redirecionar automaticamente
    } catch (err: any) {
      setError(err.error_description || err.message || "Ocorreu um erro.");
    } finally {
      setLoading(false);
    }
  };


  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-secondary rounded-2xl p-4 mb-6 shadow-lg">
            <Scissors className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            SalonFlow
          </h1>
          <p className="text-muted-foreground text-lg">
            Bem-vindo de volta!
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Faça login para acessar sua conta
          </p>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-xl border border-border backdrop-blur-sm">
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                  placeholder="voce@exemplo.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-xl flex items-start">
                <AlertCircle className="h-5 w-5 text-destructive mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
            {message && (
              <div className="bg-success/10 border border-success/30 p-4 rounded-xl">
                <p className="text-sm text-success">{message}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-base font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Aguarde...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Sistema de gestão para salões de beleza
          </p>
        </div>
      </div>
    </div>
  );
}
