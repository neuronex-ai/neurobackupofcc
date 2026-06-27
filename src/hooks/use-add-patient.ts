import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { NewPatientFormValues } from "@/lib/validation";

const cleanText = (value?: string | null) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const cleanDigits = (value?: string | null) => {
  const digits = value?.replace(/\D/g, "");
  return digits || null;
};

const cleanUuid = (value?: string | null) => {
  if (!value || value === "__none") return null;
  return value;
};

const toDateString = (date?: Date) => (date ? format(date, "yyyy-MM-dd") : null);

const parseMoneyToCents = (value?: string | null) => {
  const cleaned = value?.replace(/[^\d,.-]/g, "").trim();
  if (!cleaned) return 0;

  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const amount = Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
};

const parseBillingDay = (value?: string | null) => {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31 ? day : null;
};

const buildAddress = (patientData: NewPatientFormValues) => {
  const line = [
    cleanText(patientData.street),
    cleanText(patientData.street_number),
    cleanText(patientData.neighborhood),
    cleanText(patientData.city),
    cleanText(patientData.state),
  ].filter(Boolean);

  return cleanText(patientData.address) || (line.length ? line.join(", ") : null);
};

const rollbackPatient = async (patientId: string, userId: string, error: unknown) => {
  await supabase.from("patients").delete().eq("id", patientId).eq("user_id", userId);
  const message = error instanceof Error ? error.message : "Falha ao salvar dados complementares.";
  throw new Error(message);
};

const addPatient = async (patientData: NewPatientFormValues, userId: string) => {
  const relativeContact = [patientData.relative_name, patientData.relative_phone]
    .map(cleanText)
    .filter(Boolean)
    .join(" - ");

  const emergencyContact = [patientData.emergency_name, patientData.emergency_phone]
    .map(cleanText)
    .filter(Boolean)
    .join(" - ");

  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      user_id: userId,
      name: patientData.name.trim(),
      email: cleanText(patientData.email),
      phone: cleanText(patientData.mobile_phone || patientData.phone),
      cpf: cleanDigits(patientData.cpf),
      diagnosis: cleanText(patientData.diagnosis),
      notes: cleanText(patientData.notes),
      status: "pending",
      birth_date: toDateString(patientData.birth_date),
      address: buildAddress(patientData),
      emergency_contact: emergencyContact || relativeContact || null,
      payer_type: patientData.payer_type,
      payer_name: cleanText(patientData.payer_name),
      payer_cpf: cleanDigits(patientData.payer_cpf),
      medications: patientData.medications || [],
      group_type: patientData.group_type,
      quick_registration: patientData.quick_registration,
      phone_country_code: cleanText(patientData.phone_country_code) || "+55",
      mobile_phone: cleanText(patientData.mobile_phone),
      landline_phone: cleanText(patientData.landline_phone || patientData.phone),
      rg: cleanText(patientData.rg),
      gender_identity: patientData.gender_identity,
      has_social_name: patientData.has_social_name,
      social_name: patientData.has_social_name ? cleanText(patientData.social_name) : null,
      country: cleanText(patientData.country) || "Brasil",
      postal_code: cleanText(patientData.postal_code),
      city: cleanText(patientData.city),
      state: cleanText(patientData.state),
      street: cleanText(patientData.street),
      street_number: cleanText(patientData.street_number),
      neighborhood: cleanText(patientData.neighborhood),
      complement: cleanText(patientData.complement),
      naturality: cleanText(patientData.naturality),
      education_level: cleanText(patientData.education_level),
      race: cleanText(patientData.race),
      profession: cleanText(patientData.profession),
      relative_name: cleanText(patientData.relative_name),
      relative_relationship: cleanText(patientData.relative_relationship),
      relative_phone: cleanText(patientData.relative_phone),
      how_met_option_id: cleanUuid(patientData.source_option_id),
      referred_by_option_id: cleanUuid(patientData.referrer_option_id),
      identification_color: patientData.identification_color || "#685094",
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao adicionar paciente:", error);
    throw new Error(error.message);
  }

  try {
    const sessionValueCents = parseMoneyToCents(patientData.session_value);

    const { error: financialError } = await supabase
      .from("patient_financial_settings")
      .insert({
        user_id: userId,
        patient_id: patient.id,
        professional_name: cleanText(patientData.professional_name),
        plan_type: patientData.financial_plan,
        session_value_cents: sessionValueCents,
        monthly_value_cents: parseMoneyToCents(patientData.monthly_value) || null,
        convenio_name: cleanText(patientData.convenio_name),
        billing_day: parseBillingDay(patientData.billing_day),
      });

    if (financialError) throw new Error(financialError.message);

    const hasResponsible = [
      patientData.responsible_name,
      patientData.responsible_email,
      patientData.responsible_mobile_phone,
      patientData.responsible_cpf,
      patientData.responsible_rg,
    ].some((value) => Boolean(cleanText(value)));

    if (hasResponsible || patientData.responsible_use_for_billing_documents) {
      const { error: responsibleError } = await supabase
        .from("patient_responsibles")
        .insert({
          user_id: userId,
          patient_id: patient.id,
          name: cleanText(patientData.responsible_name),
          email: cleanText(patientData.responsible_email),
          phone_country_code: cleanText(patientData.responsible_phone_country_code) || "+55",
          mobile_phone: cleanText(patientData.responsible_mobile_phone),
          cpf: cleanDigits(patientData.responsible_cpf),
          rg: cleanText(patientData.responsible_rg),
          birth_date: toDateString(patientData.responsible_birth_date),
          use_for_billing_documents: patientData.responsible_use_for_billing_documents,
        });

      if (responsibleError) throw new Error(responsibleError.message);
    }

    if (patientData.tag_ids?.length) {
      const { error: tagsError } = await supabase
        .from("patient_tag_assignments")
        .insert(
          patientData.tag_ids.map((tagId) => ({
            user_id: userId,
            patient_id: patient.id,
            tag_id: tagId,
          })),
        );

      if (tagsError) throw new Error(tagsError.message);
    }

    await supabase
      .from("psychologist_patient_preferences")
      .upsert({
        user_id: userId,
        default_quick_registration: patientData.quick_registration,
        default_group_type: patientData.group_type,
        default_country: cleanText(patientData.country) || "Brasil",
        default_identification_color: patientData.identification_color || "#685094",
        default_financial_plan: patientData.financial_plan,
        default_session_value_cents: sessionValueCents,
      }, { onConflict: "user_id" });
  } catch (companionError) {
    await rollbackPatient(patient.id, userId, companionError);
  }

  return patient;
};

export const useAddPatient = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id;

  return useMutation({
    mutationFn: (patientData: NewPatientFormValues) => {
      if (!userId) throw new Error("Usuário não autenticado.");
      return addPatient(patientData, userId);
    },
    onSuccess: (patient) => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      queryClient.setQueryData(["patients", patient.id], patient);
    },
  });
};
