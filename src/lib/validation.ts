import * as z from "zod";

export const NewPatientSchema = z.object({
  name: z.string().min(2, { message: "O nome deve ter pelo menos 2 caracteres." }),
  email: z.string().email({ message: "Email inválido." }).optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")), // Novo campo
  diagnosis: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  // Novos campos
  birth_date: z.date().optional(),
  address: z.string().optional().or(z.literal("")),
  // Separando contato de emergência
  emergency_name: z.string().optional().or(z.literal("")),
  emergency_phone: z.string().optional().or(z.literal("")),

  payer_type: z.enum(["patient", "other"]).default("patient"),
  payer_name: z.string().optional().or(z.literal("")),
  payer_cpf: z.string().optional().or(z.literal("")),
  medications: z.array(z.object({
    name: z.string().min(1, "Nome necessário"),
    dosage: z.string().optional(),
    frequency: z.string().optional(),
  })).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.payer_type === 'other') {
    if (!data.payer_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nome do responsável é obrigatório.",
        path: ['payer_name'],
      });
    }
    if (!data.payer_cpf) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF do responsável é obrigatório.",
        path: ['payer_cpf'],
      });
    }
  } else {
    // Se o pagador for o paciente, o CPF dele é importante para a emissão da NFS-e
    // Podemos deixar opcional no cadastro geral, mas é bom ter validação se preenchido
  }
});

export type NewPatientFormValues = z.infer<typeof NewPatientSchema>;

const BaseAppointmentSchema = z.object({
  patient_id: z.string().uuid({ message: "Selecione um paciente válido." }),
  date: z.date({ required_error: "A data da consulta é obrigatória." }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, { message: "Formato de hora inválido (HH:mm)." }),
  duration: z.string().min(1, { message: "Duração é obrigatória." }),
  type: z.enum(["presencial", "online"], { required_error: "O tipo de consulta é obrigatório." }),
  notes: z.string().optional(),
  location: z.string().optional().or(z.literal("")),
});

export const NewAppointmentSchema = BaseAppointmentSchema.superRefine((data, ctx) => {
  if (data.type === 'presencial' && !data.location) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O endereço é obrigatório para consultas presenciais.",
      path: ['location'],
    });
  }
});

export type NewAppointmentFormValues = z.infer<typeof NewAppointmentSchema>;

export const NewRecurringAppointmentSchema = BaseAppointmentSchema.extend({
  repetition: z.enum(["weekly", "biweekly", "monthly"], { required_error: "A repetição é obrigatória." }),
  endDate: z.date({ required_error: "A data final da recorrência é obrigatória." }),
}).superRefine((data, ctx) => {
  if (data.type === 'presencial' && !data.location) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "O endereço é obrigatório para consultas presenciais.",
      path: ['location'],
    });
  }
  if (data.endDate <= data.date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "A data final deve ser posterior ou igual à data inicial.",
      path: ['endDate'],
    });
  }
});

export type NewRecurringAppointmentFormValues = z.infer<typeof NewRecurringAppointmentSchema>;

export const NewTransactionSchema = z.object({
  description: z.string().min(3, { message: "A descrição deve ter pelo menos 3 caracteres." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser positivo." }),
  type: z.enum(["income", "expense"], { required_error: "O tipo é obrigatório." }),
  category: z.string().optional(),
  date: z.coerce.date({ required_error: "A data é obrigatória." }),
  payment_method: z.enum(['pix', 'money', 'credit_card', 'debit_card', 'boleto', 'mixed']).default('pix').optional(),
  installments: z.coerce.number().min(1).default(1).optional(),
  external_reference: z.string().optional(),
  patient_id: z.string().optional(),
  package_id: z.string().optional(),
  create_new_package: z.boolean().optional(),
  new_package_sessions: z.coerce.number().optional(),
  debit_session: z.boolean().optional().default(true),
});

export type NewTransactionFormValues = z.infer<typeof NewTransactionSchema>;

export const LoginFormSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  rememberMe: z.boolean().default(false).optional(),
});

export type LoginFormValues = z.infer<typeof LoginFormSchema>;

export const SignupFormSchema = z.object({
  email: z.string().email({ message: "Email inválido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  firstName: z.string().min(2, { message: "O primeiro nome é obrigatório." }),
  lastName: z.string().min(2, { message: "O sobrenome é obrigatório." }),
});

export type SignupFormValues = z.infer<typeof SignupFormSchema>;