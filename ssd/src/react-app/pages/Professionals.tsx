// src/react-app/pages/Professionals.tsx

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../auth/SupabaseAuthProvider';
import { useAppStore } from '../../shared/store';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmationModal from '../components/ConfirmationModal';
import ProfessionalFormModal from '../components/ProfessionalFormModal'; // Importado
import { useToastHelpers } from '../contexts/ToastContext';
import { Plus, Briefcase, Edit, Trash2, DollarSign, TrendingUp, MoreVertical } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ProfessionalType } from '../../shared/types';

export default function Professionals() {
  const { user } = useSupabaseAuth();
  const { professionals, loading, fetchProfessionals, deleteProfessional } = useAppStore();
  const { showSuccess, showError } = useToastHelpers();

  // --- Estados para gerenciar os modais ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<ProfessionalType | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<ProfessionalType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfessionals(user.id);
    }
  }, [user, fetchProfessionals]);

  // --- Funções para manipular os modais ---
  const handleNewProfessional = () => {
    setEditingProfessional(null);
    setIsModalOpen(true);
  };

  const handleEditProfessional = (professional: ProfessionalType) => {
    setEditingProfessional(professional);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProfessional(null);
  };

  const handleDeleteClick = (professional: ProfessionalType) => {
    setProfessionalToDelete(professional);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !professionalToDelete) return;

    setIsDeleting(true);
    try {
      await deleteProfessional(professionalToDelete.id!);
      showSuccess('Profissional removido!', 'O profissional foi removido da sua equipe.');
      setIsDeleteModalOpen(false);
      setProfessionalToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir profissional:', (error as Error).message);
      showError('Erro ao remover profissional.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading.professionals) {
    return <Layout><LoadingSpinner /></Layout>;
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-8 pb-24 lg:pb-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-foreground">Profissionais</h1>
            <p className="mt-2 text-muted-foreground">Gerencie sua equipe</p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            {/* Botão para abrir o modal de novo profissional */}
            <button
              type="button"
              onClick={handleNewProfessional}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:brightness-110"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Profissional
            </button>
          </div>
        </div>

        <div className="mt-8">
          {professionals.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Briefcase className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum profissional cadastrado</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Comece adicionando profissionais à sua equipe para gerenciar agendamentos e acompanhar desempenho.
              </p>
              <button
                onClick={handleNewProfessional}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:brightness-110 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Primeiro Profissional
              </button>
            </div>
          ) : (
            // --- Grid de Cards melhorados para os profissionais ---
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {professionals.map((professional: ProfessionalType) => (
                <ProfessionalCard
                  key={professional.id}
                  professional={professional}
                  onEdit={handleEditProfessional}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modais sendo renderizados */}
      <ProfessionalFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingProfessional={editingProfessional}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Profissional"
        message={`Tem certeza que deseja excluir "${professionalToDelete?.name}"? Esta ação removerá o profissional da sua equipe, mas não afetará os agendamentos passados.`}
        confirmText="Excluir"
        variant="danger"
        isLoading={isDeleting}
      />
    </Layout>
  );
}

// Componente de Card do Profissional
interface ProfessionalCardProps {
  professional: ProfessionalType;
  onEdit: (professional: ProfessionalType) => void;
  onDelete: (professional: ProfessionalType) => void;
}

function ProfessionalCard({ professional, onEdit, onDelete }: ProfessionalCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="group bg-card rounded-xl shadow-sm border border-border hover:shadow-lg hover:border-primary/20 transition-all duration-200 overflow-hidden">
      {/* Header com cor de identificação */}
      <div
        className="h-2 w-full"
        style={{ backgroundColor: professional.color || 'hsl(var(--secondary))' }} // Use secondary as fallback
      />

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-primary-foreground font-semibold text-lg shadow-sm"
              style={{ backgroundColor: professional.color || 'hsl(var(--secondary))' }} // Use secondary as fallback
            >
              {professional.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {professional.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {professional.commission_rate ? `${(professional.commission_rate * 100).toFixed(1)}% comissão` : 'Sem comissão'}
              </p>
            </div>
          </div>

          {/* Menu de ações */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showActions && (
              <div className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                <button
                  onClick={() => {
                    onEdit(professional);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-foreground hover:bg-accent flex items-center"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    onDelete(professional);
                    setShowActions(false);
                  }}
                  className="w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Informações financeiras */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-accent rounded-lg p-3">
            <div className="flex items-center mb-1">
              <DollarSign className="w-4 h-4 text-success mr-1" />
              <span className="text-xs font-medium text-muted-foreground">Salário Base</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {professional.salary ? `R$ ${(professional.salary / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Não definido'}
            </p>
          </div>

          <div className="bg-accent rounded-lg p-3">
            <div className="flex items-center mb-1">
              <TrendingUp className="w-4 h-4 text-secondary mr-1" />
              <span className="text-xs font-medium text-muted-foreground">Comissão</span>
            </div>
            <p className="text-sm font-semibold text-foreground">
              {professional.commission_rate ? `${(professional.commission_rate * 100).toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>

        {/* Link para detalhes */}
        <Link
          to={`/professionals/${professional.id}`}
          className="block w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground text-center py-2.5 rounded-lg font-medium hover:brightness-110 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Ver Detalhes
        </Link>
      </div>
    </div>
  );
}