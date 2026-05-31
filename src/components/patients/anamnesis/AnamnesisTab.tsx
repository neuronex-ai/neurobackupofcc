import { useState, useEffect } from "react";
import { RouteSelection } from "./RouteSelection";
import { ImportAnamnesis } from "./ImportAnamnesis";
import { TemplateAnamnesis } from "./TemplateAnamnesis";
import { ViewAnamnesis } from "./ViewAnamnesis";
import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function AnamnesisTab() {
    const { id: patientId } = useParams<{ id: string }>();
    const [currentStep, setCurrentStep] = useState<'loading' | 'selection' | 'import' | 'template' | 'view'>('loading');
    const [viewKey, setViewKey] = useState(0);

    useEffect(() => {
        if (patientId) {
            checkExistingAnamnesis();
        }
    }, [patientId]);

    const checkExistingAnamnesis = async () => {
        try {
            // Fetch all records for this patient (there may be multiple due to UNIQUE(patient_id, type))
            const { data: records, error } = await supabase
                .from('patient_anamneses')
                .select('id, content')
                .eq('patient_id', patientId);

            if (error) throw error;

            // Find the first record with valid content
            const validRecord = records?.find(
                r => r.content && Array.isArray(r.content) && r.content.length > 0
            );

            if (validRecord) {
                // Clean up any empty-content records
                const emptyRecords = records?.filter(
                    r => r.id !== validRecord.id && (!r.content || (Array.isArray(r.content) && r.content.length === 0))
                );
                if (emptyRecords && emptyRecords.length > 0) {
                    for (const r of emptyRecords) {
                        await supabase.from('patient_anamneses').delete().eq('id', r.id);
                    }
                }
                setCurrentStep('view');
            } else {
                // No valid records found — clean up any empty ones
                if (records && records.length > 0) {
                    for (const r of records) {
                        await supabase.from('patient_anamneses').delete().eq('id', r.id);
                    }
                }
                setCurrentStep('selection');
            }
        } catch (error) {
            console.error(error);
            setCurrentStep('selection');
        }
    };

    const handleBack = () => {
        checkExistingAnamnesis();
    };

    const handleSuccess = () => {
        // Increment viewKey to force ViewAnamnesis to remount and re-fetch fresh data
        setViewKey(k => k + 1);
        setCurrentStep('view');
    };

    if (currentStep === 'loading') {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-[600px] relative px-1 animate-fade-in pb-20">
            <AnimatePresence mode="wait">

                {currentStep === 'selection' && (
                    <motion.div
                        key="selection"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <RouteSelection onSelectRoute={setCurrentStep} />
                    </motion.div>
                )}

                {currentStep === 'import' && (
                    <motion.div
                        key="import"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <ImportAnamnesis onBack={handleBack} onSuccess={handleSuccess} />
                    </motion.div>
                )}

                {currentStep === 'template' && (
                    <motion.div
                        key="template"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <TemplateAnamnesis onBack={handleBack} onSuccess={handleSuccess} />
                    </motion.div>
                )}

                {currentStep === 'view' && (
                    <motion.div
                        key={`view-${viewKey}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <ViewAnamnesis
                            onChangeTemplate={() => setCurrentStep('template')}
                            onResetToSelection={() => setCurrentStep('selection')}
                        />
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
}
