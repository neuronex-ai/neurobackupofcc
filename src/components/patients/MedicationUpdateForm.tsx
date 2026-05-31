import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useUpdatePatient } from "@/hooks/use-update-patient";
import { Patient } from "@/types";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const MedicationSchema = z.object({
    medications: z.array(z.object({
        name: z.string().min(1, "Nome necessário"),
        dosage: z.string().optional(),
        frequency: z.string().optional(),
    })).optional().default([]),
});

type MedicationFormValues = z.infer<typeof MedicationSchema>;

interface MedicationUpdateFormProps {
    patient: Patient;
    onSuccess: () => void;
}

export const MedicationUpdateForm = ({ patient, onSuccess }: MedicationUpdateFormProps) => {
    const { mutate, isPending } = useUpdatePatient();

    const form = useForm<MedicationFormValues>({
        resolver: zodResolver(MedicationSchema),
        defaultValues: {
            medications: patient.medications || []
        }
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "medications"
    });

    const onSubmit = (values: MedicationFormValues) => {
        mutate({
            id: patient.id,
            updates: {
                medications: values.medications ? values.medications.map(m => ({
                    name: m.name || "",
                    dosage: m.dosage,
                    frequency: m.frequency
                })) : []
            }
        }, {
            onSuccess: () => {
                toast.success("Medicações atualizadas!");
                onSuccess();
            },
            onError: (err) => {
                toast.error("Erro ao atualizar: " + err.message);
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex gap-3 items-start animate-in slide-in-from-left-2 fade-in duration-300">
                            <FormField
                                control={form.control}
                                name={`medications.${index}.name`}
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormControl>
                                            <Input placeholder="Nome da medicação" {...field} className="bg-secondary/20 border-border/10 h-10 text-sm rounded-xl focus:border-blue-500/30 transition-all font-medium placeholder:text-muted-foreground/70 text-foreground" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`medications.${index}.dosage`}
                                render={({ field }) => (
                                    <FormItem className="w-24">
                                        <FormControl>
                                            <Input placeholder="Mg" {...field} className="bg-secondary/20 border-border/10 h-10 text-sm rounded-xl focus:border-blue-500/30 transition-all text-center placeholder:text-muted-foreground/70 text-foreground" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="h-10 w-10 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors flex-shrink-0"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <div className="py-8 text-center border border-dashed border-border/20 rounded-2xl bg-secondary/5">
                            <p className="text-xs text-muted-foreground">Nenhuma medicação registrada.</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ name: "", dosage: "" })}
                        className="flex-1 h-11 border-dashed border-border/20 hover:bg-secondary/20 text-muted-foreground hover:text-foreground rounded-xl text-xs uppercase font-bold tracking-wider"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Adicionar
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs uppercase font-bold tracking-wider shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                    </Button>
                </div>
            </form>
        </Form>
    );
};
