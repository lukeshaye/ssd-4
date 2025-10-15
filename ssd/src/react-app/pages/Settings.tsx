import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useSupabaseAuth } from '../auth/SupabaseAuthProvider';
import { supabase } from '../supabaseClient';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import { Settings as SettingsIcon, Clock, Plus, Trash2, X, Save } from 'lucide-react';
import { useToastHelpers } from '../contexts/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

// --- Definição de Tipos ---
interface BusinessHours {
  id?: number;
  user_id?: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
}

interface BusinessException {
  id?: number;
  exception_date: string;
  start_time?: string | null;
  end_time?: string | null;
  description: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

/**
 * Página para gerir as configurações do estabelecimento.
 */
export default function Settings() {
  const { user } = useSupabaseAuth();
  const { showSuccess, showError } = useToastHelpers();

  // --- Estados do Componente ---
  const [exceptions, setExceptions] = useState<BusinessException[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [exceptionToDelete, setExceptionToDelete] = useState<BusinessException | null>(null);

  // --- Formulário para Horários de Funcionamento ---
  const {
    register: registerHours,
    handleSubmit: handleSubmitHours,
    control,
    reset: resetHours,
    formState: { isSubmitting: isSubmittingHours },
  } = useForm<{ hours: BusinessHours[] }>({
    defaultValues: {
      hours: DAYS_OF_WEEK.map(day => ({ 
        day_of_week: day.value, 
        start_time: null, 
        end_time: null 
      }))
    }
  });
  
  const { fields } = useFieldArray({ control, name: "hours" });

  // --- Formulário para Exceções ---
  const {
    register: registerException,
    handleSubmit: handleSubmitException,
    reset: resetException,
    formState: { errors: exceptionErrors, isSubmitting: isSubmittingException },
  } = useForm<BusinessException>();

  // --- Efeito para Carregar os Dados ---
  useEffect(() => {
    if (user) {
      Promise.all([
        fetchBusinessHours(),
        fetchExceptions()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const fetchBusinessHours = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (data) {
        const hoursData = DAYS_OF_WEEK.map(day => {
          const existing = data.find(h => h.day_of_week === day.value);
          return existing || { day_of_week: day.value, start_time: '', end_time: '' };
        });
        resetHours({ hours: hoursData });
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', (error as Error).message);
      showError('Erro ao carregar horários', 'Não foi possível buscar as configurações de horário.');
    }
  };

  const fetchExceptions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('business_exceptions')
        .select('*')
        .eq('user_id', user.id)
        .order('exception_date', { ascending: true });
      
      if (error) throw error;
      if (data) setExceptions(data);
    } catch (error) {
      console.error('Erro ao carregar exceções:', (error as Error).message);
      showError('Erro ao carregar exceções', 'Não foi possível buscar os feriados e exceções.');
    }
  };

  const onSubmitHours = async (data: { hours: BusinessHours[] }) => {
    if (!user) return;
    try {
      const hoursToUpsert = data.hours.map(h => ({
        ...h,
        user_id: user.id,
        start_time: h.start_time || null,
        end_time: h.end_time || null,
      }));

      const { error } = await supabase
        .from('business_settings')
        .upsert(hoursToUpsert, { onConflict: 'user_id, day_of_week' });

      if (error) throw error;
      
      showSuccess('Horários salvos!', 'Seus horários de funcionamento foram atualizados.');
      await fetchBusinessHours();
    } catch (error) {
      console.error('Erro ao salvar horários:', (error as Error).message);
      showError('Erro ao salvar', 'Não foi possível salvar os horários. Tente novamente.');
    }
  };

  const onSubmitException = async (data: BusinessException) => {
    if (!user) return;
    try {
      const exceptionData = {
        ...data,
        user_id: user.id,
        start_time: data.start_time || null,
        end_time: data.end_time || null,
      };

      const { error } = await supabase
        .from('business_exceptions')
        .insert([exceptionData]);

      if (error) throw error;
      
      showSuccess('Exceção adicionada!', 'A nova exceção de horário foi salva.');
      await fetchExceptions();
      handleCloseExceptionModal();
    } catch (error) {
      console.error('Erro ao salvar exceção:', (error as Error).message);
      showError('Erro ao salvar exceção', 'Não foi possível salvar. Verifique os dados.');
    }
  };
  
  const requestDeleteException = (exception: BusinessException) => {
    setExceptionToDelete(exception);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteException = async () => {
    if (!user || !exceptionToDelete) return;
    try {
      const { error } = await supabase
        .from('business_exceptions')
        .delete()
        .eq('id', exceptionToDelete.id!)
        .eq('user_id', user.id);
      
      if (error) throw error;
      showSuccess('Exceção removida!', 'A exceção foi removida com sucesso.');
      await fetchExceptions();
    } catch (error) {
      console.error('Erro ao excluir exceção:', (error as Error).message);
      showError('Erro ao remover', 'Não foi possível remover a exceção.');
    } finally {
      setIsDeleteModalOpen(false);
      setExceptionToDelete(null);
    }
  };

  const handleCloseExceptionModal = () => {
    setIsExceptionModalOpen(false);
    resetException();
  };

  const applyToAllDays = (startTime: string, endTime: string) => {
    const hoursData = DAYS_OF_WEEK.map(day => ({ 
      day_of_week: day.value, 
      start_time: startTime, 
      end_time: endTime 
    }));
    resetHours({ hours: hoursData });
  };
  
  if (loading) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center mb-8">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="mt-2 text-muted-foreground">Defina as configurações do seu estabelecimento</p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card text-foreground shadow-sm rounded-xl border border-border">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center">
                  <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-2 mr-3">
                    <Clock className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Horários de Funcionamento</h3>
              </div>
            </div>
            <form onSubmit={handleSubmitHours(onSubmitHours)} className="px-6 py-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                  <h4 className="text-sm font-semibold text-foreground mb-3">Aplicar a todos os dias</h4>
                  <div className="flex items-center space-x-3">
                    <input
                      type="time"
                      id="applyStartTime"
                      className="border-gray-300 rounded-lg shadow-sm focus:ring-pink-500 focus:border-pink-500 text-sm px-3 py-2"
                    />
                    <span className="text-muted-foreground font-medium">até</span>
                    <input
                      type="time"
                      id="applyEndTime"
                      className="border-gray-300 rounded-lg shadow-sm focus:ring-pink-500 focus:border-pink-500 text-sm px-3 py-2"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const startTime = (document.getElementById('applyStartTime') as HTMLInputElement)?.value;
                        const endTime = (document.getElementById('applyEndTime') as HTMLInputElement)?.value;
                        if (startTime && endTime) {
                          applyToAllDays(startTime, endTime);
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm rounded-lg hover:brightness-110 transition-colors font-medium"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="bg-muted p-4 rounded-lg border border-border">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                        <label className="text-sm font-semibold text-foreground">
                          {DAYS_OF_WEEK.find(d => d.value === field.day_of_week)?.label}
                        </label>
                        <div className="col-span-2 flex items-center space-x-3">
                          <input
                            type="time"
                            {...registerHours(`hours.${index}.start_time`)}
                            className="border-gray-300 rounded-lg shadow-sm focus:ring-pink-500 focus:border-pink-500 text-sm w-full px-3 py-2"
                          />
                          <span className="text-muted-foreground font-medium">até</span>
                          <input
                            type="time"
                            {...registerHours(`hours.${index}.end_time`)}
                            className="border-gray-300 rounded-lg shadow-sm focus:ring-pink-500 focus:border-pink-500 text-sm w-full px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingHours}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmittingHours ? 'Salvando...' : 'Salvar Horários'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-card text-foreground shadow-sm rounded-xl border border-border">
            <div className="px-6 py-5 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-2 mr-3">
                    <SettingsIcon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Exceções e Feriados</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsExceptionModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Exceção
                </button>
              </div>
            </div>
            <div className="px-6 py-6">
              {exceptions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center bg-gradient-to-r from-primary to-secondary rounded-xl p-4 mb-6">
                    <SettingsIcon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma exceção cadastrada</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Adicione feriados ou dias com horários especiais para melhorar o controle da sua agenda.
                  </p>
                  <button
                    onClick={() => setIsExceptionModalOpen(true)}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Nova Exceção
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {exceptions.map((exception) => (
                    <div
                      key={exception.id}
                      className="flex items-center justify-between p-5 border border-border rounded-xl bg-muted hover:bg-accent transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-3 py-1 rounded-lg text-sm font-semibold">
                            {new Date(exception.exception_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <p className="text-base font-semibold text-foreground mb-1">{exception.description}</p>
                        {exception.start_time && exception.end_time ? (
                          <p className="text-sm text-muted-foreground flex items-center">
                            <Clock className="w-4 h-4 mr-1.5" />
                            {exception.start_time} - {exception.end_time}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Dia inteiro (fechado)</p>
                        )}
                      </div>
                      <button
                        onClick={() => requestDeleteException(exception)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isExceptionModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-overlay/75 transition-opacity" onClick={handleCloseExceptionModal}></div>
              <div className="inline-block align-bottom bg-card text-foreground border border-border rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmitException(onSubmitException)}>
                  <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Nova Exceção</h3>
                      <button type="button" onClick={handleCloseExceptionModal} className="text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="space-y-4">
                       <div>
                        <label htmlFor="exception_date" className="block text-sm font-medium text-foreground">Data *</label>
                        <input type="date" {...registerException('exception_date', { required: 'Data é obrigatória' })} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        {exceptionErrors.exception_date && <p className="mt-1 text-sm text-destructive">{exceptionErrors.exception_date.message}</p>}
                      </div>
                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-foreground">Descrição *</label>
                        <input type="text" {...registerException('description', { required: 'Descrição é obrigatória' })} placeholder="Ex: Feriado Nacional" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        {exceptionErrors.description && <p className="mt-1 text-sm text-destructive">{exceptionErrors.description.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="start_time" className="block text-sm font-medium text-foreground">Hora Início</label>
                          <input type="time" {...registerException('start_time')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                          <p className="mt-1 text-xs text-muted-foreground">Deixe vazio se fechado</p>
                        </div>
                        <div>
                          <label htmlFor="end_time" className="block text-sm font-medium text-foreground">Hora Fim</label>
                          <input type="time" {...registerException('end_time')} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button type="submit" disabled={isSubmittingException} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-primary to-secondary text-base font-medium text-primary-foreground hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                      {isSubmittingException ? 'Salvando...' : 'Criar'}
                    </button>
                    <button type="button" onClick={handleCloseExceptionModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-background text-base font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDeleteException}
            title="Excluir Exceção"
            message={`Tem certeza que deseja excluir a exceção "${exceptionToDelete?.description}"?`}
            confirmText="Excluir"
            variant="danger"
        />
      </div>
    </Layout>
  );
}
