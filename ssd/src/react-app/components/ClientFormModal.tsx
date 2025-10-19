// src/react-app/components/ClientFormModal.tsx

import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSupabaseAuth } from '../auth/SupabaseAuthProvider';
import { useAppStore } from '../../shared/store';
import { useToastHelpers } from '../contexts/ToastContext';
import { X, User, Mail, Phone } from 'lucide-react';
import type { ClientType } from '../../shared/types';
import { CreateClientSchema } from '../../shared/types';

// --- PrimeReact Imports ---
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputMask } from 'primereact/inputmask';
import { Calendar, CalendarChangeParams } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';

// --- Definição de Tipos ---
interface ClientFormData {
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  birth_date?: Date | null;
  gender?: 'masculino' | 'feminino' | 'outro' | null;
}

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (client: ClientType) => void;
  editingClient: ClientType | null;
}

const defaultFormValues: ClientFormData = {
    name: '',
    phone: '',
    email: '',
    notes: '',
    birth_date: null,
    gender: null,
};

const genderOptions = [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Feminino', value: 'feminino' },
    { label: 'Outro', value: 'outro' },
];

export default function ClientFormModal({ isOpen, onClose, onClientCreated, editingClient }: ClientFormModalProps) {
  const { user } = useSupabaseAuth();
  const { addClient, updateClient } = useAppStore();
  const { showSuccess, showError } = useToastHelpers();

  const calendarInputRef = useRef<HTMLInputElement | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormData>({
    resolver: zodResolver(CreateClientSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
  });

  const onSubmit = async (formData: ClientFormData) => {
    if (!user) return;
    try {
      if (editingClient) {
        await updateClient({ ...editingClient, ...formData });
        showSuccess('Cliente atualizado!');
      } else {
        const newClient = await addClient(formData, user.id);
        showSuccess('Cliente adicionado!');
        onClientCreated(newClient);
      }
      onClose();
    } catch (error) {
      showError('Erro ao salvar cliente');
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (editingClient) {
        reset({
            name: editingClient.name,
            phone: editingClient.phone || '',
            email: editingClient.email || '',
            notes: editingClient.notes || '',
            birth_date: editingClient.birth_date ? new Date(editingClient.birth_date) : null,
            gender: editingClient.gender,
        });
      } else {
        reset(defaultFormValues);
      }
    }
  }, [isOpen, editingClient, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-overlay/75 transition-opacity" onClick={onClose} aria-hidden="true"></div>
        {/* Modal Content */}
        <div className="inline-block align-bottom bg-card text-foreground border border-border rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Header */}
            <div className="bg-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-foreground">
                  {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
                </h3>
                <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              {/* Form Fields */}
              <div className="space-y-4">

                {/* Campo Nome */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Nome *</label>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                      <span className="p-input-icon-left w-full">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <InputText
                          id={field.name}
                          {...field}
                          placeholder="Ex: Maria Silva"
                          className={`w-full pl-10 ${fieldState.error ? 'p-invalid' : ''}`} // p-invalid é do PrimeReact, mantenha
                          // Estilos baseados em variáveis CSS serão aplicados via CSS global ou classes PrimeReact customizadas se necessário
                        />
                      </span>
                    )}
                  />
                  {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
                </div>

                {/* Campo Telefone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">Telefone</label>
                   <Controller
                    name="phone"
                    control={control}
                    render={({ field, fieldState }) => (
                      <span className="p-input-icon-left w-full">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <InputMask
                          id={field.name}
                          {...field}
                          mask="(99) 99999-9999"
                          placeholder="(11) 99999-9999"
                          className={`w-full pl-10 ${fieldState.error ? 'p-invalid' : ''}`}
                          unmask={true}
                        />
                      </span>
                    )}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>}
                </div>

                {/* Campo Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field, fieldState }) => (
                       <span className="p-input-icon-left w-full">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <InputText
                          id={field.name}
                          {...field}
                          type="email"
                          placeholder="Ex: maria@email.com"
                          className={`w-full pl-10 ${fieldState.error ? 'p-invalid' : ''}`}
                        />
                       </span>
                    )}
                  />
                  {errors.email && <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>}
                </div>

                {/* Campos: Data de Nascimento e Gênero */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="birth_date" className="block text-sm font-medium text-foreground mb-1">Data de Nascimento</label>
                    <Controller
                      name="birth_date"
                      control={control}
                      render={({ field, fieldState }) => (
                        <Calendar
                          id={field.name}
                          ref={(el) => {
                            if (el) {
                                calendarInputRef.current = el.getInput();
                            }
                          }}
                          value={field.value}
                          onChange={(e: CalendarChangeParams) => field.onChange(e.value)}
                          dateFormat="dd/mm/yy"
                          placeholder="DD/MM/AAAA"
                          mask="99/99/9999"
                          showOnFocus={false}
                          className={`w-full ${fieldState.error ? 'p-invalid' : ''}`} // p-invalid mantido
                          // Estilos do PrimeReact customizados em primereact-calendar-styles.css
                        />
                      )}
                    />
                    {errors.birth_date && <p className="mt-1 text-sm text-destructive">{errors.birth_date.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-foreground mb-1">Gênero</label>
                    <Controller
                        name="gender"
                        control={control}
                        render={({ field, fieldState }) => (
                            <Dropdown
                              id={field.name}
                              value={field.value}
                              options={genderOptions}
                              onChange={(e) => field.onChange(e.value)}
                              placeholder="Selecione"
                              className={`w-full ${fieldState.error ? 'p-invalid' : ''}`} // p-invalid mantido
                              // Estilos do PrimeReact customizados em primereact-calendar-styles.css
                            />
                        )}
                    />
                    {errors.gender && <p className="mt-1 text-sm text-destructive">{errors.gender.message}</p>}
                  </div>
                </div>

                {/* Campo Notas */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">Notas</label>
                    <Controller
                        name="notes"
                        control={control}
                        render={({ field }) => (
                            <InputTextarea
                                id={field.name}
                                {...field}
                                rows={3}
                                className="w-full" // Estilos base do PrimeReact, cores virão do tema global
                                placeholder="Preferências, observações..."
                            />
                        )}
                    />
                    {errors.notes && <p className="mt-1 text-sm text-destructive">{errors.notes.message}</p>}
                </div>

              </div>
            </div>
            {/* Footer com Botões */}
            <div className="bg-muted px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button type="submit" disabled={isSubmitting} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gradient-to-r from-primary to-secondary text-base font-medium text-primary-foreground hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
              </button>
              <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-border shadow-sm px-4 py-2 bg-background text-base font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}