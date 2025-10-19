import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Aqui você pode enviar o erro para um serviço de monitoramento
    // como Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Exemplo: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            {/* --- CARD PRINCIPAL --- */}
            <div className="bg-card text-foreground border border-border py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div className="text-center">
                {/* --- ÍCONE DE ERRO --- */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 mb-4"> {/* Aplicado bg-destructive/10 */}
                  <AlertTriangle className="h-6 w-6 text-destructive" /> {/* Aplicado text-destructive */}
                </div>

                {/* --- TÍTULO E MENSAGEM --- */}
                <h1 className="text-2xl font-bold text-foreground mb-2"> {/* Aplicado text-foreground */}
                  Oops! Algo deu errado
                </h1>

                <p className="text-muted-foreground mb-6"> {/* Aplicado text-muted-foreground */}
                  Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver o problema.
                </p>

                {/* --- DETALHES DO ERRO (DESENVOLVIMENTO) --- */}
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-md text-left"> {/* Aplicado bg-destructive/10, border-destructive/30 */}
                    <h3 className="text-sm font-medium text-destructive mb-2"> {/* Aplicado text-destructive */}
                      Detalhes do erro (modo desenvolvimento):
                    </h3>
                    <pre className="text-xs text-destructive whitespace-pre-wrap overflow-auto"> {/* Aplicado text-destructive */}
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}

                {/* --- BOTÕES DE AÇÃO --- */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* Botão Tentar Novamente (Primário) */}
                  <button
                    onClick={this.handleRetry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring" /* Aplicado text-primary-foreground, bg-gradient-to-r from-primary to-secondary, hover:brightness-110, focus:ring-ring */
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Tentar novamente
                  </button>

                  {/* Botão Ir para Início (Secundário/Outline) */}
                  <button
                    onClick={this.handleGoHome}
                    className="inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring" /* Aplicado border-border, text-foreground, bg-background, hover:bg-accent, focus:ring-ring */
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Ir para início
                  </button>
                </div>

                {/* --- MENSAGEM DE SUPORTE --- */}
                <div className="mt-6 text-sm text-muted-foreground"> {/* Aplicado text-muted-foreground */}
                  <p>
                    Se o problema persistir, entre em contato conosco em{' '}
                    <a
                      href="mailto:suporte@salonflow.app"
                      className="text-primary hover:brightness-110" /* Aplicado text-primary, hover:brightness-110 */
                    >
                      suporte@salonflow.app
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;