// src/react-app/pages/ProfessionalDetail.tsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSupabaseAuth } from '../auth/SupabaseAuthProvider';
import { useAppStore } from '../../shared/store';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import { supabase } from '../supabaseClient';
import { 
    BarChart, Calendar, XCircle, DollarSign, ArrowLeft, Plus, Trash2, Save, 
    Users, TrendingUp, Scissors, X 
} from 'lucide-react';
import type { ProfessionalType } from '../../shared/types';
import { useToastHelpers } from '../contexts/ToastContext';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { formatCurrency } from '../utils';
import moment from 'moment';

// --- Tipos para os dados do componente ---

interface OverviewData {
    totalAppointments: number;
    totalRevenue: number;
    topServices: { service: string; count: number }[];
    topClients: { client_name: string; count: number }[];
}

interface ProfessionalAbsence {
  id: number;
  date: string;
  reason: string | null;
}

interface ProfessionalException {
    id: number;
    start_date: string;
    end_date: string;
    description: string;
}

interface AbsenceFormData {
    date: string;
    reason: string;
}

interface ExceptionFormData {
    start_date: string;
    end_date: string;
    description: string;
}

interface ScheduleFormData {
  schedules: {
    day_of_week: number;
    start_time: string | null;
    end_time: string | null;
    lunch_start_time: string | null;
    lunch_end_time: string | null;
  }[];
}

interface FinancialSummary {
    commissionEarnings: number;
    totalAppointments: number;
}


const DAYS_OF_WEEK = [
  { value: 1, label: 'Segunda-feira' }, { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' }, { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' }, { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

type Period = 'weekly' | 'monthly' | 'yearly';

export default function ProfessionalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();
  const { professionals, fetchProfessionals } = useAppStore();
  const { showSuccess, showError } = useToastHelpers();

  const [professional, setProfessional] = useState<ProfessionalType | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [absences, setAbsences] = useState<ProfessionalAbsence[]>([]);
  const [exceptions, setExceptions] = useState<ProfessionalException[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [isDeleteAbsenceModalOpen, setIsDeleteAbsenceModalOpen] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState<ProfessionalAbsence | null>(null);
  const [isDeleteExceptionModalOpen, setIsDeleteExceptionModalOpen] = useState(false);
  const [exceptionToDelete, setExceptionToDelete] = useState<ProfessionalException | null>(null);
  const [period, setPeriod] = useState<Period>('monthly');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<'absence' | 'exception' | null>(null);

  const absenceForm = useForm<AbsenceFormData>({ defaultValues: { date: new Date().toISOString().split('T')[0], reason: '' } });
  const exceptionForm = useForm<ExceptionFormData>({ defaultValues: { start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], description: '' }});
  const scheduleForm = useForm<ScheduleFormData>({ defaultValues: { schedules: DAYS_OF_WEEK.map(day => ({ day_of_week: day.value, start_time: null, end_time: null, lunch_start_time: null, lunch_end_time: null }))}});
  const { fields } = useFieldArray({ control: scheduleForm.control, name: "schedules" });

    const loadProfessionalData = useCallback(async (currentPeriod: Period) => {
        const professionalId = Number(id);
        if (!user || !id || isNaN(professionalId)) {
            navigate('/professionals');
            return;
        }

        setLoading(true);
        try {
            let foundProfessional = professionals.find(p => p.id === professionalId);
            if (!foundProfessional) {
                await fetchProfessionals(user.id);
                foundProfessional = useAppStore.getState().professionals.find(p => p.id === professionalId);
            }
            if (!foundProfessional) throw new Error("Profissional não encontrado");
            setProfessional(foundProfessional);

            let startDate: moment.Moment;
            const endDate = moment().endOf('day');

            switch (currentPeriod) {
                case 'weekly':
                    startDate = moment().startOf('week');
                    break;
                case 'yearly':
                    startDate = moment().startOf('year');
                    break;
                case 'monthly':
                default:
                    startDate = moment().startOf('month');
                    break;
            }
            
            const [appointmentsRes, absencesRes, exceptionsRes, schedulesRes] = await Promise.all([
                supabase.from('appointments').select('price, service, client_name').eq('professional_id', professionalId).eq('attended', true).gte('appointment_date', startDate.toISOString()).lte('appointment_date', endDate.toISOString()),
                supabase.from('professional_absences').select('*').eq('professional_id', professionalId).order('date', { ascending: false }),
                supabase.from('professional_exceptions').select('*').eq('professional_id', professionalId).order('start_date', { ascending: false }),
                supabase.from('professional_schedules').select('*').eq('professional_id', professionalId),
            ]);

            if (appointmentsRes.error) throw appointmentsRes.error;
            if (absencesRes.error) throw absencesRes.error;
            if (exceptionsRes.error) throw exceptionsRes.error;
            if (schedulesRes.error) throw schedulesRes.error;

            const attendedAppointments = appointmentsRes.data || [];
            const totalRevenue = attendedAppointments.reduce((sum, app) => sum + app.price, 0);
            
            const serviceCounts = attendedAppointments.reduce((acc, app) => {
                acc[app.service] = (acc[app.service] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topServices = Object.entries(serviceCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([service, count]) => ({ service, count }));

            const clientCounts = attendedAppointments.reduce((acc, app) => {
                acc[app.client_name] = (acc[app.client_name] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            const topClients = Object.entries(clientCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([client_name, count]) => ({ client_name, count }));

            setOverviewData({
                totalAppointments: attendedAppointments.length,
                totalRevenue,
                topServices,
                topClients,
            });
            
            const commissionEarnings = totalRevenue * (foundProfessional.commission_rate || 0);
            setFinancialSummary({ commissionEarnings, totalAppointments: attendedAppointments.length });

            const scheduleData = DAYS_OF_WEEK.map(day => {
                const existing = schedulesRes.data?.find(s => s.day_of_week === day.value);
                return existing || { day_of_week: day.value, start_time: null, end_time: null, lunch_start_time: null, lunch_end_time: null };
            });
            scheduleForm.reset({ schedules: scheduleData });

            setAbsences(absencesRes.data || []);
            setExceptions(exceptionsRes.data || []);

        } catch (error) {
            showError('Erro ao carregar detalhes', (error as Error).message);
            navigate('/professionals');
        } finally {
            setLoading(false);
        }
    }, [id, user, professionals, navigate, showError, fetchProfessionals, scheduleForm]);

    useEffect(() => {
        loadProfessionalData(period);
    }, [period, loadProfessionalData]);
    
    const openAddModal = (type: 'absence' | 'exception') => {
        setModalContent(type);
        setIsAddModalOpen(true);
    };

    const closeAddModal = () => {
        setIsAddModalOpen(false);
        setModalContent(null);
        absenceForm.reset({ date: new Date().toISOString().split('T')[0], reason: '' });
        exceptionForm.reset({ start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0], description: '' });
    };

    const onAddAbsence = async (formData: AbsenceFormData) => {
        if (!user || !professional) return;
        try {
            const { data, error } = await supabase.from('professional_absences').insert({ professional_id: professional.id, user_id: user.id, date: formData.date, reason: formData.reason }).select();
            if (error) throw error;
            if (data) setAbsences(prev => [data[0], ...prev].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            showSuccess("Falta registrada!");
            closeAddModal();
        } catch (error) { showError("Erro ao registrar falta", (error as Error).message); }
    };
    
    const onAddException = async (formData: ExceptionFormData) => {
        if (!user || !professional) return;
        try {
            const { data, error } = await supabase.from('professional_exceptions').insert({ professional_id: professional.id, user_id: user.id, ...formData }).select();
            if (error) throw error;
            if (data) setExceptions(prev => [data[0], ...prev].sort((a,b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()));
            showSuccess("Exceção registrada!");
            closeAddModal();
        } catch (error) { showError("Erro ao registrar exceção", (error as Error).message); }
    };

    const handleDeleteAbsenceConfirm = async () => {
        if (!user || !absenceToDelete) return;
        try {
            const { error } = await supabase.from('professional_absences').delete().eq('id', absenceToDelete.id);
            if (error) throw error;
            setAbsences(prev => prev.filter(a => a.id !== absenceToDelete.id));
            showSuccess("Falta removida!");
        } catch (error) { showError("Erro ao remover falta", (error as Error).message);
        } finally {
            setIsDeleteAbsenceModalOpen(false);
            setAbsenceToDelete(null);
        }
    };
  
    const handleDeleteExceptionConfirm = async () => {
        if (!user || !exceptionToDelete) return;
        try {
            const { error } = await supabase.from('professional_exceptions').delete().eq('id', exceptionToDelete.id);
            if (error) throw error;
            setExceptions(prev => prev.filter(e => e.id !== exceptionToDelete.id));
            showSuccess("Exceção removida!");
        } catch (error) { showError("Erro ao remover exceção", (error as Error).message);
        } finally {
            setIsDeleteExceptionModalOpen(false);
            setExceptionToDelete(null);
        }
    };

    const onSaveSchedule = async (formData: ScheduleFormData) => {
        if (!user || !professional) return;
        try {
            const schedulesToUpsert = formData.schedules.map(s => ({
                professional_id: professional.id,
                user_id: user.id,
                day_of_week: s.day_of_week,
                start_time: s.start_time || null,
                end_time: s.end_time || null,
                lunch_start_time: s.lunch_start_time || null,
                lunch_end_time: s.lunch_end_time || null,
            }));

            const { error } = await supabase.from('professional_schedules').upsert(schedulesToUpsert, { onConflict: 'professional_id, day_of_week' });
            if (error) throw error;
            showSuccess("Horários salvos com sucesso!");
        } catch (error) {
            showError("Erro ao salvar horários", (error as Error).message);
        }
    };

  if (loading && !professional) return <Layout><LoadingSpinner /></Layout>;
  if (!professional) return <Layout><p className="text-center py-10">Profissional não encontrado.</p></Layout>;

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart }, { id: 'absences', label: 'Faltas', icon: XCircle },
    { id: 'financial', label: 'Financeiro', icon: DollarSign }, { id: 'schedule', label: 'Horários', icon: Calendar },
  ];

  const renderContent = () => {
    switch (activeTab) {
        case 'overview':
            const maxServiceCount = Math.max(...overviewData?.topServices.map(s => s.count) || [1]);
            const maxClientCount = Math.max(...overviewData?.topClients.map(c => c.count) || [1]);
            return (
                <div className="space-y-6">
                    {/* Seletor de período melhorado */}
                    <div className="flex justify-center sm:justify-end">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
                            <div className="flex items-center">
                                <button 
                                    onClick={() => setPeriod('weekly')} 
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        period === 'weekly' 
                                            ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Semanal
                                </button>
                                <button 
                                    onClick={() => setPeriod('monthly')} 
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        period === 'monthly' 
                                            ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Mensal
                                </button>
                                <button 
                                    onClick={() => setPeriod('yearly')} 
                                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                                        period === 'yearly' 
                                            ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Anual
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner/>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Card de desempenho principal */}
                            <div className="lg:col-span-1">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex items-center mb-6">
                                        <div className="bg-gradient-to-r from-violet-100 to-pink-100 rounded-lg p-3 mr-4">
                                            <TrendingUp className="h-6 w-6 text-violet-600" />
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-800">Desempenho</h4>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                                            <p className="text-sm font-medium text-green-600 mb-1">Total Faturado</p>
                                            <p className="text-3xl font-bold text-green-700">{formatCurrency(overviewData?.totalRevenue || 0)}</p>
                                        </div>
                                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                                            <p className="text-sm font-medium text-blue-600 mb-1">Atendimentos</p>
                                            <p className="text-3xl font-bold text-blue-700">{overviewData?.totalAppointments || 0}</p>
                                        </div>
                                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4">
                                            <p className="text-sm font-medium text-purple-600 mb-1">Ticket Médio</p>
                                            <p className="text-3xl font-bold text-purple-700">
                                                {formatCurrency((overviewData?.totalAppointments || 0) > 0 ? (overviewData?.totalRevenue || 0) / overviewData!.totalAppointments : 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Cards de rankings */}
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <RankingCard title="Serviços Mais Realizados" icon={Scissors} data={overviewData?.topServices} labelKey="service" valueKey="count" maxCount={maxServiceCount} />
                                <RankingCard title="Clientes Mais Frequentes" icon={Users} data={overviewData?.topClients} labelKey="client_name" valueKey="count" maxCount={maxClientCount} />
                            </div>
                        </div>
                    )}
                </div>
            );
        case 'absences': 
            // CORRIGIDO: O formulário de registro agora é condicional para desktop
            return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="hidden md:block md:col-span-1">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Registrar Nova Falta</h4>
                        <form onSubmit={absenceForm.handleSubmit(onAddAbsence)} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                            <div> <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data *</label> <Controller name="date" control={absenceForm.control} render={({ field }) => (<input type="date" {...field} className="input"/>)}/> </div>
                            <div> <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motivo (opcional)</label> <Controller name="reason" control={absenceForm.control} render={({ field }) => (<textarea {...field} rows={3} className="input" placeholder="Ex: Consulta médica"/>)}/> </div>
                            <button type="submit" disabled={absenceForm.formState.isSubmitting} className="w-full btn-primary"> <Plus className="w-4 h-4 mr-2"/> {absenceForm.formState.isSubmitting ? 'Registrando...' : 'Registrar'} </button>
                        </form>
                    </div>
                    <div className="md:col-span-2">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">Histórico de Faltas ({absences.length})</h4>
                        {absences.length === 0 ? (<p className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">Nenhuma falta registrada.</p>) : (<ul className="space-y-3 max-h-96 overflow-y-auto pr-2"> {absences.map(absence => (<li key={absence.id} className="bg-white p-3 rounded-md border flex justify-between items-center"> <div> <p className="font-medium">{new Date(absence.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p> <p className="text-sm text-gray-600 italic">{absence.reason || 'Sem motivo especificado'}</p> </div> <button onClick={() => { setAbsenceToDelete(absence); setIsDeleteAbsenceModalOpen(true); }} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"> <Trash2 className="w-4 h-4"/> </button> </li>))} </ul>)}
                    </div>
                </div>
            );
        case 'financial': 
            const salary = professional.salary || 0; 
            const commission = financialSummary?.commissionEarnings || 0; 
            const totalEarnings = salary + commission; 
            return <div className="max-w-2xl mx-auto"> <h4 className="text-lg font-medium text-gray-800 mb-4"> Resumo Financeiro - {moment().format('MMMM [de] YYYY')} </h4> <div className="bg-white border rounded-lg shadow-sm divide-y"> <div className="p-4 flex justify-between items-center"> <p className="text-gray-600">Salário Base</p> <p className="font-semibold text-gray-900">{formatCurrency(salary)}</p> </div> <div className="p-4 flex justify-between items-center"> <p className="text-gray-600">Taxa de Comissão</p> <p className="font-semibold text-gray-900">{(professional.commission_rate || 0) * 100}%</p> </div> <div className="p-4 flex justify-between items-center bg-gray-50"> <p className="text-gray-600"> Ganhos com Comissão ({financialSummary?.totalAppointments} atendimentos) </p> <p className="font-semibold text-green-600">{formatCurrency(commission)}</p> </div> <div className="p-4 flex justify-between items-center text-lg"> <p className="font-bold text-gray-800">Ganhos Totais no Mês</p> <p className="font-bold text-blue-600">{formatCurrency(totalEarnings)}</p> </div> </div> </div>;
        case 'schedule': 
            // CORRIGIDO: O formulário de exceções agora é condicional para desktop
            return (
                <div className="space-y-8">
                    <form onSubmit={scheduleForm.handleSubmit(onSaveSchedule)}>
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <h4 className="text-lg font-medium text-gray-800 mb-6">Horário Padrão de Trabalho</h4>
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
                                        <label className="text-sm font-medium text-gray-700 md:col-span-1">{DAYS_OF_WEEK.find(d => d.value === field.day_of_week)?.label}</label>
                                        <div className="col-span-2 md:col-span-2 flex items-center gap-2"> <input type="time" {...scheduleForm.register(`schedules.${index}.start_time`)} className="input-time"/> <span className="text-gray-500">-</span> <input type="time" {...scheduleForm.register(`schedules.${index}.end_time`)} className="input-time"/> </div>
                                        <div className="col-span-2 md:col-span-2 flex items-center gap-2"> <input type="time" {...scheduleForm.register(`schedules.${index}.lunch_start_time`)} className="input-time" placeholder="Almoço Início"/> <span className="text-gray-500">-</span> <input type="time" {...scheduleForm.register(`schedules.${index}.lunch_end_time`)} className="input-time" placeholder="Almoço Fim"/> </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button type="submit" disabled={scheduleForm.formState.isSubmitting} className="btn-primary">
                                    <Save className="w-4 h-4 mr-2"/> {scheduleForm.formState.isSubmitting ? 'Salvando...' : 'Salvar Horários'}
                                </button>
                            </div>
                        </div>
                    </form>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="hidden md:block md:col-span-1">
                             <h4 className="text-lg font-medium text-gray-800 mb-4">Registrar Férias/Folga</h4>
                             <form onSubmit={exceptionForm.handleSubmit(onAddException)} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                                <div> <label className="label">Descrição *</label> <Controller name="description" control={exceptionForm.control} render={({ field }) => (<input type="text" {...field} className="input" placeholder="Ex: Férias de Verão"/>)}/> </div>
                                <div className="grid grid-cols-2 gap-4"> <div> <label className="label">Data Início *</label> <Controller name="start_date" control={exceptionForm.control} render={({ field }) => (<input type="date" {...field} className="input"/>)}/> </div> <div> <label className="label">Data Fim *</label> <Controller name="end_date" control={exceptionForm.control} render={({ field }) => (<input type="date" {...field} className="input"/>)}/> </div> </div>
                                <button type="submit" disabled={exceptionForm.formState.isSubmitting} className="w-full btn-primary"> <Plus className="w-4 h-4 mr-2"/> {exceptionForm.formState.isSubmitting ? 'Registrando...' : 'Registrar Exceção'} </button>
                             </form>
                        </div>
                        <div className="md:col-span-2">
                            <h4 className="text-lg font-medium text-gray-800 mb-4">Histórico de Exceções ({exceptions.length})</h4>
                            {exceptions.length === 0 ? (<p className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">Nenhuma exceção registrada.</p>) : (<ul className="space-y-3 max-h-72 overflow-y-auto pr-2"> {exceptions.map(exception => (<li key={exception.id} className="bg-white p-3 rounded-md border flex justify-between items-center"> <div> <p className="font-medium">{exception.description}</p> <p className="text-sm text-gray-600">{moment(exception.start_date).format('DD/MM/YY')} - {moment(exception.end_date).format('DD/MM/YY')}</p> </div> <button onClick={() => { setExceptionToDelete(exception); setIsDeleteExceptionModalOpen(true); }} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"> <Trash2 className="w-4 h-4"/> </button> </li>))} </ul>)}
                        </div>
                    </div>
                </div>
            );
      default: return null;
    }
  };

  return (
    <Layout>
        <style>{` .input { width: 100%; border-radius: 0.375rem; border: 1px solid #d1d5db; padding: 0.5rem 0.75rem; } .input-time { width: 100%; border-radius: 0.375rem; border: 1px solid #d1d5db; padding: 0.25rem 0.5rem; } .label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem; } .btn-primary { display: inline-flex; align-items: center; justify-content: center; padding: 0.5rem 1rem; border: 1px solid transparent; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; color: white; background-image: linear-gradient(to right, #ec4899, #8b5cf6); } .btn-primary:hover { background-image: linear-gradient(to right, #db2777, #7c3aed); } .btn-primary:disabled { opacity: 0.5; } `}</style>
        <div className="px-4 sm:px-6 lg:px-8 pb-24">
            {/* Header melhorado */}
            <div className="mb-8">
                <Link to="/professionals" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 group transition-colors"> 
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                    Voltar para todos os profissionais 
                </Link>
                
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div 
                            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                            style={{ backgroundColor: professional.color || '#a855f7' }}
                        >
                            {professional.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{professional.name}</h1>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                                {professional.commission_rate && (
                                    <span className="flex items-center">
                                        <TrendingUp className="w-4 h-4 mr-1" />
                                        {(professional.commission_rate * 100).toFixed(1)}% comissão
                                    </span>
                                )}
                                {professional.salary && (
                                    <span className="flex items-center">
                                        <DollarSign className="w-4 h-4 mr-1" />
                                        R$ {(professional.salary / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Navegação das abas melhorada */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="sm:hidden">
                    <nav className="flex space-x-1 p-1" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`flex-1 flex items-center justify-center py-2.5 px-3 rounded-md font-medium text-sm transition-all duration-200 ${
                                    activeTab === tab.id 
                                        ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon className="mr-2 h-4 w-4" /> 
                                <span className="hidden xs:inline">{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="hidden sm:block">
                    <nav className="flex space-x-1 p-1" aria-label="Tabs">
                        {tabs.map((tab) => (
                            <button 
                                key={tab.id} 
                                onClick={() => setActiveTab(tab.id)} 
                                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium text-sm transition-all duration-200 ${
                                    activeTab === tab.id 
                                        ? 'bg-gradient-to-r from-pink-500 to-violet-500 text-white shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                <tab.icon className="mr-2 h-5 w-5" /> 
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            <div className="mt-8">{renderContent()}</div>
        </div>

        {(activeTab === 'absences' || activeTab === 'schedule') && (
            <div className="lg:hidden fixed bottom-6 right-6 z-40">
                <button
                    onClick={() => openAddModal(activeTab === 'absences' ? 'absence' : 'exception')}
                    className="bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full p-4 shadow-lg hover:scale-110 active:scale-100 transition-transform duration-200"
                    aria-label={activeTab === 'absences' ? 'Registrar Falta' : 'Registrar Exceção'}
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>
        )}

        {isAddModalOpen && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="flex items-center justify-center min-h-screen p-4 text-center">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={closeAddModal}></div>
                    <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                        {modalContent === 'absence' && (
                            <form onSubmit={absenceForm.handleSubmit(onAddAbsence)}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                  <div className="flex items-center justify-between mb-4">
                                      <h3 className="text-lg font-medium text-gray-900">Registrar Nova Falta</h3>
                                      <button type="button" onClick={closeAddModal} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                                  </div>
                                   <div className="space-y-4">
                                      <div> <label htmlFor="date" className="block text-sm font-medium text-gray-700">Data *</label> <Controller name="date" control={absenceForm.control} render={({ field }) => (<input type="date" {...field} className="input"/>)}/> </div>
                                      <div> <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Motivo (opcional)</label> <Controller name="reason" control={absenceForm.control} render={({ field }) => (<textarea {...field} rows={3} className="input" placeholder="Ex: Consulta médica"/>)}/> </div>
                                  </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="submit" disabled={absenceForm.formState.isSubmitting} className="btn-primary w-full sm:w-auto"> {absenceForm.formState.isSubmitting ? 'Registrando...' : 'Registrar'} </button>
                                    <button type="button" onClick={closeAddModal} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mr-3">Cancelar</button>
                                </div>
                            </form>
                        )}
                        {modalContent === 'exception' && (
                            <form onSubmit={exceptionForm.handleSubmit(onAddException)}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="flex items-center justify-between mb-4">
                                      <h3 className="text-lg font-medium text-gray-900">Registrar Férias/Folga</h3>
                                      <button type="button" onClick={closeAddModal} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
                                  </div>
                                   <div className="space-y-4">
                                      <div> <label className="label">Descrição *</label> <Controller name="description" control={exceptionForm.control} render={({ field }) => (<input type="text" {...field} className="input" placeholder="Ex: Férias de Verão"/>)}/> </div>
                                      <div className="grid grid-cols-2 gap-4"> <div> <label className="label">Data Início *</label> <Controller name="start_date" control={exceptionForm.control} render={({ field }) => (<input type="date" {...field} className="input"/>)}/> </div> <div> <label className="label">Data Fim *</label> <Controller name="end_date" control={exceptionForm.control} render={({ field }) => (<input type="date" {...field} className="input"/>)}/> </div> </div>
                                  </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="submit" disabled={exceptionForm.formState.isSubmitting} className="btn-primary w-full sm:w-auto"> {exceptionForm.formState.isSubmitting ? 'Registrando...' : 'Registrar Exceção'} </button>
                                    <button type="button" onClick={closeAddModal} className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mr-3">Cancelar</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        )}

      <ConfirmationModal isOpen={isDeleteAbsenceModalOpen} onClose={() => setIsDeleteAbsenceModalOpen(false)} onConfirm={handleDeleteAbsenceConfirm} title="Excluir Registro de Falta" message={`Tem certeza que deseja remover o registro de falta do dia ${absenceToDelete ? new Date(absenceToDelete.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}?`} confirmText="Excluir" variant="danger" />
      <ConfirmationModal isOpen={isDeleteExceptionModalOpen} onClose={() => setIsDeleteExceptionModalOpen(false)} onConfirm={handleDeleteExceptionConfirm} title="Excluir Exceção" message={`Tem certeza que deseja remover o registro de "${exceptionToDelete?.description}"?`} confirmText="Excluir" variant="danger" />
    </Layout>
  );
}

const RankingCard = ({ title, icon: Icon, data, labelKey, valueKey, maxCount }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center mb-6">
            <div className="bg-gradient-to-r from-pink-100 to-violet-100 rounded-lg p-3 mr-4">
                <Icon className="h-6 w-6 text-pink-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        </div>
        {data && data.length > 0 ? (
            <ul className="space-y-4">
                {data.map((item: any, index: number) => {
                    const percentage = maxCount > 0 ? (item[valueKey] / maxCount) * 100 : 0;
                    const colors = [
                        'from-pink-400 to-rose-500',
                        'from-violet-400 to-purple-500', 
                        'from-blue-400 to-cyan-500'
                    ];
                    const bgColors = [
                        'bg-pink-50',
                        'bg-violet-50',
                        'bg-blue-50'
                    ];
                    
                    return (
                        <li key={index} className={`${bgColors[index % 3]} rounded-lg p-3`}>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-semibold text-gray-700 truncate pr-2">
                                    {item[labelKey]}
                                </p>
                                <div className="flex items-center">
                                    <span className="text-lg font-bold text-gray-800 mr-2">{item[valueKey]}</span>
                                    <span className="text-xs text-gray-500">
                                        {percentage.toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-white rounded-full h-2 shadow-inner">
                                <div 
                                    className={`bg-gradient-to-r ${colors[index % 3]} h-2 rounded-full transition-all duration-500 ease-out`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
        ) : (
            <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <Icon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 font-medium">Nenhum dado disponível</p>
                <p className="text-xs text-gray-400 mt-1">para o período selecionado</p>
            </div>
        )}
    </div>
);
